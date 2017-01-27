const authenticationController = () => {
    const jwt = require('jsonwebtoken');
    const config = require('../config/config');
    const authenticationModel = require('../models/authenticationModel')();

    /**
     * Generates JWT using user info and config key. 
     */
    let generateToken = (userInfo) => {
        return jwt.sign(userInfo, config.passport.key, { expiresIn: 10080 });
    }

    /**
     * Controls which info gets passed back and is used in JWT creation
     */
    let setUserInfo = (request) => {
        return {
            DBID: request.DBID,
            UID: request.UID,
            ID: request.ID,
            EMAIL: request.Email
        }
    }

    /**
     * Passes back JWT and user info if login is successful
     */
    let login = (req, res) => {
        console.log('Login successful. Returning JWT and User JSON');
        let userInfo = setUserInfo(req.user);
        res.status(201).json({
            token: 'JWT ' + generateToken(userInfo),
            user: userInfo
        });
    }

    /**
     * If JWT passed is correct and still valid then user json is returned
     */
    let verify = (req, res) => {
        console.log('User Verified');
        let user = setUserInfo(req.user)
        res.status(201).json(user);
    }

    /**
     * Register a new user
     */
    let register = (req, res) => {

        //Prep new user data
        let newUser = {};
        newUser.DBID = "dbid" + Math.floor((new Date()).getTime() / 1000);
        newUser.ID = Math.random().toString(36).substring(6);
        newUser.UID = req.body.UID || Math.random().toString(36).substring(10);
        newUser.PID = Math.random().toString(36).substring(15);

        // console.log(JSON.stringify(newUser));

        authenticationModel.addNewUser(newUser, (err, result) => {
            if (!err) {
                // res.status(201).json(result);
                console.log('Attempting login')
                // req.login({ UID: newUser.UID, PID: newUser.PID }, function (err) {
                //     if (err) {
                //         console.log(err);
                //         res.status(500).send(err);
                //     } else {
                //         console.log('Login successful. Redirecting to dashboard.')
                //         return res.redirect('/dashboard');
                //     }
                // });

                
            } else {
                res.status(500).send(err);
            }
        });
    }

    return {
        login: login,
        verify: verify,
        register: register
    }
}

module.exports = authenticationController;