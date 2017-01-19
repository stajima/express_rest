const authenticationController = () => {
    const jwt = require('jsonwebtoken');
    const config = require('../config/config');

    generateToken = (userInfo) => {
        return jwt.sign(userInfo, config.passport.key, { expiresIn: 10080 });
    }

    setUserInfo = (request) => {
        //TODO
        return {
            userInfo: 'blah blah'
        }
    }

    let login = (req, res, next) => {
        //TODO req.user is undefined. Most likely because of something in passport.js
        let userInfo = setUserInfo(req.user);
        
        console.log('Generating JWT Key');
        res.status(200).json({
            token: 'JWT' + generateToken(userInfo),
            userInfo: userInfo
        });
    }

    return {
        login: login
    }
}

module.exports = authenticationController;