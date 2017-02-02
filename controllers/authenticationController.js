const authenticationController = () => {
    const jwt = require('jsonwebtoken');
    const config = require('../config/config');
    const authenticationModel = require('../models/authenticationModel')();
    const bcrypt = require('bcrypt');


    /**
     * Generate random char string then calls addNewUser().
     */
    function makeid(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    /**
     * Passes back JWT and user info if login is successful
     */
    let login = (req, res) => {

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
        let newUser = {};

        /**
         * Returns Bcrypt hash.
         */
        const saltRounds = 10;
        let generateHash = (myPlaintextPassword) => {
            // console.log('plain text pass: ' + myPlaintextPassword);
            bcrypt.genSalt(saltRounds, function (err, salt) {
                bcrypt.hash(myPlaintextPassword, salt, function (err, generatedHash) {
                    // console.log('hash: ' + generatedHash);
                    newUser.Hash = generatedHash;
                    addNewUser();
                });
            });
        }

        /**
         * Adds new user and returns based on err.
         */
        let addNewUser = () => {
            console.log("User: " + JSON.stringify(newUser));
            authenticationModel.addNewUser(newUser, (err, result) => {
                if (!err) {
                    //User add was successful
                    res.status(201).json({
                        success: true,
                        message: 'New user has been added',
                        user: {
                            UID: newUser.UID,
                            Password: password
                        }
                    });

                } else {
                    res.status(500).send(err);
                }
            });
        }


        /**
         * Preps new user data. Calls generateHash() at the end.
         */
        const password = 'test' || req.body.Hash || makeid(15);
        let createUserPayload = () => {
            newUser.DBID = "dbid" + Math.floor((new Date()).getTime() / 1000);
            newUser.ID = req.body.ID || makeid(6);
            newUser.UID = req.body.UID || makeid(10);
            generateHash(password);
        }

        createUserPayload();

    }

    return {
        login: login,
        verify: verify,
        register: register
    }
}

module.exports = authenticationController;