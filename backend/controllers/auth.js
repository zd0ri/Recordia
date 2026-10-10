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
    });

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
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ error: 'User not found with this email' })

    }
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    // Create reset password url
    const resetUrl = `${req.protocol}://localhost:5173/password/reset/${resetToken}`;
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`
    try {
        await sendEmail({
            email: user.email,
            subject: 'ShopIT Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ error: error.message })

    }
})

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
    const user = await User.findById(req.user.id);
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
    })
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
    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return res.status(400).json({ message: 'Old password is incorrect' })
    }
    user.password = req.body.password;
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
    const users = await User.find(filter).sort({ createdAt: -1 });
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
        name: req.body.name,
        email: req.body.email,
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

    user.name = newUserData.name;
    user.email = newUserData.email;
    user.role = newUserData.role;
    user.isActive = newUserData.isActive;
    await user.save();

    return res.status(200).json({
        success: true,
        user: sanitizeUser(user)
    })
})