const admin = require('firebase-admin');

let initialized = false;

const getFirebaseAuth = () => {
    if (!initialized) {
        const {
            FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY
        } = process.env;

        if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
            const error = new Error(
                'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
            );
            error.statusCode = 500;
            throw error;
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: FIREBASE_PROJECT_ID,
                clientEmail: FIREBASE_CLIENT_EMAIL,
                privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
        });
        initialized = true;
    }

    return admin.auth();
};

module.exports = getFirebaseAuth;
