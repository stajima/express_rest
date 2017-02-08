const authenticationController = () => {
    const jwt = require('jsonwebtoken');
    const config = require('../config/config');
    const authenticationModel = require('../models/authenticationModel')();
    const bcrypt = require('bcrypt');
    const crypto = require('crypto');
    const nodemailer = require('nodemailer');
    const moment = require('moment');
    const path = require('path');

    /**
     * Generate random char string
     *
    function makeId(length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        
        return text;
    }
    */

    /**
    * Controls which info gets passed back and is used in JWT creation
    */
    let setUserInfo = (request) => {
        return {
            DBID: request.DBID,
            UID: request.UID,
            ID: request.ID,
            EMAIL: request.Email
        };
    };

    /**
     * Passes back JWT and user info if login is successful
     */
    let login = (req, res) => {

        /**
        * Generates JWT using user info and config key. 
        */
        let generateToken = (userInfo) => {
            return jwt.sign(userInfo, config.passport.key, { expiresIn: 10080 });
        };

        console.log('Login successful. Returning JWT and User JSON');
        let userInfo = setUserInfo(req.user);
        res.status(201).json({
            token: 'JWT ' + generateToken(userInfo),
            user: userInfo
        });
    };

    /**
     * If JWT passed is correct and still valid then user json is returned
     */
    let verify = (req, res) => {
        console.log('User Verified');
        let user = setUserInfo(req.user);
        res.status(201).json(user);
    };

    /**
     * Register a new user
     */
    let register = (req, res) => {

        /**
         * Adds new user and returns based on err.
         */
        let newUser = {};
        const password = 'test' || req.body.Hash || crypto.randomBytes(15).toString('hex');
        let addNewUser = () => {
            console.log('User: ' + JSON.stringify(newUser));
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
        };

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
        };


        /**
         * Preps new user data. Calls generateHash() at the end. Uses NodeJS Crypto to generate a unique random string
         */
        let createUserPayload = () => {
            newUser.DBID = 'dbid' + Math.floor((new Date()).getTime() / 1000);
            newUser.ID = req.body.ID || crypto.randomBytes(6).toString('hex');
            newUser.UID = req.body.UID || crypto.randomBytes(10).toString('hex');
            generateHash(password);
        };

        createUserPayload();

    };

    /**
     * Send user reset email with a unique token assigned to their account if they are in the DB.
     */
    let sendResetEmail = (req, res) => {
        let email;
        if (!req.body.data || !req.body.data.email) {
            // if no data or data does not contain the email return success false
            res.status(400).json({ success: false, message: 'An email address is required to request a password reset' });
        } else {
            email = req.body.data.email;
            console.log('Search for: ' + email);
        }

        authenticationModel.findUserByEmail(email, (err, user) => {
            if (err) {
                res.status(err.code).json({ success: false, message: err.message });
            } else {
                console.log('User found. Email is: ' + user.Email);

                //generate 50 character resetToken and current moment
                let resetToken = crypto.randomBytes(64).toString('hex').slice(0, 50);
                var now = moment().format();

                //TODO store resetToken and reset_request_date in users row
                authenticationModel.addResetFields(user.Email, resetToken, now, (err, success) => {
                    if (err) {
                        res.status(err.code).json({ success: false, message: err.message });
                    } else {
                        //Generate email HTML and text
                        let resetLink = 'http://www.' + config.domain + '/api/auth/reset_password/' + resetToken;

                        //Email header
                        let htmlBody = '<h1>Hi ' + user.DBID + ',</h1>';

                        //Button to reset user password 
                        let resetBtn = '<div><!--[if mso]> <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="10%" strokecolor="#1e3650" fillcolor="#ff8a0f"> <w:anchorlock/> <center style="color:#ffffff;font-family:sans-serif;font-size:13px;font-weight:bold;">RESET MY PASSWORD</center> </v:roundrect> <![endif]--><a href="' + resetLink + '" style="background-color:#ff8a0f;border:1px solid #1e3650;border-radius:4px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;mso-hide:all;">RESET MY PASSWORD</a></div>';

                        htmlBody += '<p>You recently requested a password reset on your REALTORS Association of Maui IDX administrative account.</p>' + resetBtn +
                            '<p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next 10 minutes.</p>' +
                            '<p>Aloha,</p><p>The REALTORS Association of Maui team</p>';

                        //Footer
                        htmlBody += '<hr><p>If you are having trouble clicking the password reset button, copy and paste the URL below into your web browser.</p>' +
                            '<p><a href="' + resetLink + '">' + resetLink + '</a></p>';

                        //single connection SMTP options
                        let smtpConfig = {
                            host: config.mail.host,
                            port: config.mail.port,
                            secure: config.mail.secure,
                            auth: {
                                user: config.mail.reset.user,
                                pass: config.mail.reset.pass
                            }
                        };

                        // create reusable transporter object using the default SMTP transport
                        let transporter = nodemailer.createTransport(smtpConfig);

                        // setup email data with unicode symbols
                        let mailOptions = {
                            from: config.mail.reset.from, // sender address
                            to: 'shanetajima@gmail.com', // list of receivers comma delimited
                            subject: 'RAM IDX Password Reset', // Subject line
                            // text: 'Blah blah blah', // plain text body
                            html: htmlBody // html body
                        };

                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, (err, info) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Message %s sent: %s', info.messageId, info.response);
                            }
                        });

                        //make the user think an email has been sent out even if it doesn't exist for security reasons
                        res.status(202).json({ success: true, message: 'An email has been send with instructions to reset the password.' });
                    }
                });
            }
        });
    };

    /**
     * Check to see if the token has not expired and return the reset form
     */
    let isTokenValid = (resetRequestDate) => {
        let expiration = moment().subtract(10, 'minute').format();
        console.log('exp: ' + expiration);
        console.log('request: ' + resetRequestDate);
        if (moment(resetRequestDate).isSameOrBefore(expiration)) {
            return false;
        } else {
            return true;
        }
    };


    /**
     * Return password reset form if resetToken is valid and unexpired
     */
    let sendResetForm = (req, res) => {
        console.log('reset token: ' + req.params.resetToken);
        authenticationModel.getUserWithToken(req.params.resetToken, (err, rows) => {

            if (err) {
                //TODO return error to reset form
                res.status(err.code).send(err);
            } else if (rows.length > 0) {
                let user = rows[0];
                //A user was found
                /*jshint camelcase: false */
                if (isTokenValid(user.Reset_request_date)) {
                    console.log('User found. Token valid. Sending password reset form.');
                    res.sendFile(path.join(path.resolve(__dirname, '..'), 'views', 'password_reset.html'));

                } else {
                    //TODO error
                    res.status(403).send('Token expired');
                }
            } else {
                //No users found
                //TODO return error to reset form
                res.status(404).send('Could not find the account');
            }
        });

    };

    return {
        login: login,
        verify: verify,
        register: register,
        sendResetEmail: sendResetEmail,
        sendResetForm: sendResetForm
    };
};

module.exports = authenticationController;