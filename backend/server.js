
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, 'env.txt') });
dotenv.config({ path: path.resolve(__dirname, 'config/.env') });

const app = require('./app');
const connectDatabase = require('./config/database');

const port = process.env.PORT || 4001;

connectDatabase()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server started on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
        });
    })
    .catch((error) => {
        console.error('Unable to start server:', error.message);
        process.exitCode = 1;
    });