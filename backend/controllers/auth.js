const User = require('../models/user');
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const sendEmail = require('../utils/sendEmail')
const catchAsync = require('../utils/catchAsync')
const fs = require('fs/promises')
const ErrorHandler = require('../utils/ErrorHandler')
const getFirebaseAuth = require('../utils/firebaseAdmin')

const defaultAvatar = {
    public_id: 'default_avatar',
    url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-man.jpg'
};

const sanitizeUser = (user) => {
    const userData = user.toObject ? user.toObject() : { ...user };
    if (user.isNew || user.isSelected?.('password')) {
        userData.hasPassword = Boolean(user.password);
    }
    delete userData.password;
    return userData;
};

const uploadAvatar = async (avatar) => {
    if (!avatar) {
        return defaultAvatar;
    }

    const source = typeof avatar === 'string' ? avatar : avatar.path;
    const result = await cloudinary.v2.uploader.upload(source, {
        folder: 'avatars',
        width: 150,
        crop: 'scale'
    });

    if (typeof avatar !== 'string' && avatar.path) {
        await fs.unlink(avatar.path);
    }

    return {
        public_id: result.public_id,
        url: result.secure_url
    };
};

exports.registerUser = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({
            message: 'Name, email, and password are required'
        });
    }

    const avatar = await uploadAvatar(req.file || req.body.avatar);
    const user = await User.create({
        name,
        email,
        password,
        avatar
    })
    const token = user.getJwtToken();

    return res.status(201).json({
        success: true,
        user: sanitizeUser(user),
        token
    })
    // sendToken(user, 200, res)
})

exports.loginUser = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Checks if email and password is entered by user
    if (!email || !password) {
        return res.status(400).json({ error: 'Please enter email & password' })
    }


    // Finding user in database

    let user = await User.findOne({ email }).select('+password')
    if (!user) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }


    // Checks if password is correct or not
    const isPasswordMatched = user.password
        ? await user.comparePassword(password)
        : false;


    if (!isPasswordMatched || user.isActive === false) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }
    const token = user.getJwtToken();

    res.status(201).json({
        success: true,
        token,
        user: sanitizeUser(user)
    });
    //  user = await User.findOne({ email })
    // sendToken(user, 200, res)
})

exports.firebaseLogin = catchAsync(async (req, res, next) => {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
        return next(new ErrorHandler('Firebase idToken is required', 400));
    }

    let decodedToken;
    try {
        decodedToken = await getFirebaseAuth().verifyIdToken(idToken);
    } catch (error) {
        if (error.statusCode) {
            return next(error);
        }
        return next(new ErrorHandler('Invalid Firebase idToken', 401));
    }
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email?.toLowerCase();

    if (!email) {
        return next(new ErrorHandler('Firebase account must have an email address', 400));
    }

    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let user = await User.findOne({
        $or: [
            { firebaseUid },
            { email: { $regex: `^${escapedEmail}$`, $options: 'i' } }
        ]
    }).select('+password');

    if (user) {
        if (user.isActive === false) {
            return next(new ErrorHandler('Your account is inactive', 403));
        }

        user.firebaseUid = firebaseUid;
        await user.save();
    } else {
        user = await User.create({
            name: decodedToken.name || email.split('@')[0],
            email,
            firebaseUid,
            avatar: {
                public_id: 'firebase_avatar',
                url: decodedToken.picture || defaultAvatar.url
            }
        });
    }

    return res.status(200).json({
        success: true,
        token: user.getJwtToken(),
        user: sanitizeUser(user)
    });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = email
        ? await User.findOne({ email: { $regex: `^${escapedEmail}$`, $options: 'i' } })
        : null;
    if (!user) {
        return res.status(200).json({
            success: true,
            message: 'If an account exists for that email, a password reset code has been sent.'
        });
    }

    const resetCode = crypto.randomInt(100000, 1000000).toString();
    user.resetPasswordToken = crypto.createHash('sha256').update(resetCode).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    user.resetPasswordAttempts = 0;
    await user.save({ validateBeforeSave: false });

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your Recordia password reset code',
            html: `
              <div style="background:#f4ead2;padding:32px 16px;color:#34231c;font-family:Georgia,serif;">
                <div style="max-width:520px;margin:auto;border:3px solid #542d2d;background:#fff8e8;box-shadow:8px 8px 0 #d69a2d;">
                  <div style="background:#542d2d;padding:22px;text-align:center;color:#fff8e8;">
                    <div style="color:#f3bd3b;font:700 12px monospace;letter-spacing:3px;">RECORDIA / ACCOUNT DESK</div>
                    <h1 style="margin:12px 0 0;font-size:30px;">Password reset</h1>
                  </div>
                  <div style="padding:28px;text-align:center;">
                    <p style="font:15px monospace;line-height:1.6;">Enter this one-time code to choose a new password:</p>
                    <p style="display:inline-block;margin:12px 0;padding:14px 22px;border:2px dashed #9d4e31;color:#542d2d;font:bold 32px monospace;letter-spacing:8px;">${resetCode}</p>
                    <p style="font:13px monospace;line-height:1.6;">This code expires in 10 minutes and can only be used once.</p>
                    <p style="color:#765d4b;font:12px monospace;">If you did not request a reset, you can ignore this email.</p>
                  </div>
                </div>
              </div>
            `
        });

        return res.status(200).json({
            success: true,
            message: 'If an account exists for that email, a password reset code has been sent.'
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.resetPasswordAttempts = 0;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler('Unable to send password reset email', 500));
    }
})

exports.resetPasswordWithCode = catchAsync(async (req, res, next) => {
    const { email, code, password, confirmPassword } = req.body;
    if (typeof email !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
        return next(new ErrorHandler('A valid email and 6-digit reset code are required', 400));
    }
    if (password !== confirmPassword) {
        return next(new ErrorHandler('Password does not match', 400));
    }
    if (typeof password !== 'string' || password.length < 6) {
        return next(new ErrorHandler('Password must be at least 6 characters', 400));
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({
        email: { $regex: `^${escapedEmail}$`, $options: 'i' },
        resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user || user.resetPasswordAttempts >= 5 || user.resetPasswordToken !== hashedCode) {
        if (user && user.resetPasswordAttempts < 5) {
            user.resetPasswordAttempts += 1;
            if (user.resetPasswordAttempts >= 5) {
                user.resetPasswordExpire = Date.now();
            }
            await user.save({ validateBeforeSave: false });
        }
        return next(new ErrorHandler('Password reset code is invalid or has expired', 400));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordAttempts = 0;
    await user.save();

    return res.status(200).json({
        success: true,
        message: 'Password has been reset. You can now sign in.'
    });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has been expired' })

    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Password does not match' })

    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const token = user.getJwtToken();
    return res.status(201).json({
        success: true,
        token,
        user: sanitizeUser(user)
    });

})

exports.getUserProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');
    return res.status(200).json({
        success: true,
        user: sanitizeUser(user)
    })
})

exports.updateProfile = catchAsync(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
    }

    const avatarInput = req.file || req.body.avatar;
    if (avatarInput) {
        newUserData.avatar = await uploadAvatar(avatarInput);
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    }).select('+password')
    if (!user) {
        return res.status(401).json({ message: 'User Not Updated' })
    }

    if (avatarInput && currentUser.avatar?.public_id) {
        await cloudinary.v2.uploader.destroy(currentUser.avatar.public_id);
    }

    return res.status(200).json({
        success: true,
        user: sanitizeUser(user)
    })
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    const { oldPassword, password, confirmPassword } = req.body;
    if (typeof password !== 'string' || password.length < 6) {
        return next(new ErrorHandler('New password must be at least 6 characters', 400));
    }
    if (password !== confirmPassword) {
        return next(new ErrorHandler('Passwords do not match', 400));
    }

    if (user.password) {
        if (!oldPassword) {
            return next(new ErrorHandler('Current password is required', 400));
        }
        const isMatched = await user.comparePassword(oldPassword);
        if (!isMatched) {
            return next(new ErrorHandler('Old password is incorrect', 400));
        }
    } else if (!user.firebaseUid) {
        return next(new ErrorHandler('Current password is required', 400));
    }

    user.password = password;
    await user.save();
    const token = user.getJwtToken();

    return res.status(201).json({
        success: true,
        user: sanitizeUser(user),
        token
    });

})

exports.allUsers = catchAsync(async (req, res, next) => {
    const search = typeof req.query.search === 'string'
        ? req.query.search.trim()
        : '';
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = search
        ? {
            $or: [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { email: { $regex: escapedSearch, $options: 'i' } }
            ]
        }
        : {};
    const users = await User.find({
        ...filter,
        _id: { $ne: req.user._id }
    }).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        users
    })
})

exports.deleteUser = catchAsync(async (req, res, next) => {
    if (req.params.id === req.user._id.toString()) {
        return next(new ErrorHandler(
            'You cannot deactivate your own admin account',
            400
        ));
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(401).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    user.isActive = false;
    await user.save();

    return res.status(200).json({
        success: true,
        user: sanitizeUser(user),
        message: 'User deactivated'
    })
})

exports.getUserDetails = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
})

exports.updateUser = catchAsync(async (req, res, next) => {
    const isSelf = req.params.id === req.user._id.toString();
    const newUserData = {
        role: req.body.role,
        isActive: req.body.isActive
    };

    if (
        isSelf &&
        (newUserData.role !== 'admin' || newUserData.isActive === false)
    ) {
        return next(new ErrorHandler(
            'You cannot demote or deactivate your own admin account',
            400
        ));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (!['user', 'admin'].includes(newUserData.role)
        || typeof newUserData.isActive !== 'boolean') {
        return res.status(400).json({
            success: false,
            message: 'Role and account status are required'
        });
    }
    user.role = newUserData.role;
    user.isActive = newUserData.isActive;
    await user.save();

    return res.status(200).json({
        success: true,
        user: sanitizeUser(user)
    })
})