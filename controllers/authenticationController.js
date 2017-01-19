const authenticationController = () => {
    const jwt = require('jsonwebtoken');
    const config = require('../config/config');

    generateToken = (userInfo) => {
        return jwt.sign(userInfo, config.passport.key, { expiresIn: 10080 });
    }

    setUserInfo = (request) => {
        return {
            DBID: request.DBID,
            ID: request.ID,
            EMAIL: request.Email
        }
    }

    let login = (req, res, next) => {
        let userInfo = setUserInfo(req.user);

        console.log('Generating JWT Key');
        res.status(200).json({
            token: 'JWT' + generateToken(userInfo),
            user: userInfo
        });
    }

    // let verify = (req, res) => {
    //     console.log('verifing');
    //     res.send('It worked! User id is: ' + req.user._id + '.');
    // }

    return {
        login: login,
        // verify: verify
    }
}

module.exports = authenticationController;