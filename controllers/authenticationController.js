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
     * Controls which info gets passed back and is used in JWT creation
     */
    let setUserInfo = (request) => {
        return {
            DBID: request.DBID,
            UID: request.UID,
            EMAIL: request.Email1
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
            return jwt.sign(userInfo, config.passport.key, {expiresIn: 10080});
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
     * Calls callback with hash when Bcrypt hash generation is done.
     */
    const saltRounds = 10;
    let generateHash = (myPlaintextPassword, callback) => {
        // console.log('plain text pass: ' + myPlaintextPassword);
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(myPlaintextPassword, salt, function (err, generatedHash) {
                // console.log('hash: ' + generatedHash);
                callback(generatedHash);
            });
        });
    };

    /**
     * Register a new user
     */
    let register = (req, res) => {
        let newUser = {};
        //Using test for default password during dev
        //If a password is not set by user one a 15char one is generated.
        const plainTextPassword = 'test' || req.body['password1'] || crypto.randomBytes(46).toString('hex').substring(0, 15);

        //Preps new user data. Calls generateHash() at the end. Uses NodeJS Crypto to generate a unique random string
        newUser.DBID = 'dbid' + Math.floor((new Date()).getTime() / 1000);
        newUser.ID = req.body['ID'] || crypto.randomBytes(64).toString('hex').substring(0, 6);
        newUser.UID = req.body['UID'] || crypto.randomBytes(64).toString('hex').substring(0, 10);
        newUser.AgentID = req.body['UID'] || newUser.UID; //in the agents table AgentID is the same as UID in DBID & Auth
        newUser.FirstName = 'John';
        newUser.LastName = 'Doe';
        newUser.Email1 = 'test@email.com';
        //TODO grab all form inputs

        /**
         * Get a hash and then add new user and returns based on err.
         */
        generateHash(plainTextPassword, (generatedHash) => {
            newUser.Hash = generatedHash;
            // console.log('User: ' + JSON.stringify(newUser));
            authenticationModel.addNewUser(newUser, (err) => {
                if (!err) {
                    //User add was successful
                    res.status(201).json({
                        success: true,
                        message: 'New user has been added',
                        data: {
                            user: {
                                UID: newUser.UID,
                                Password: plainTextPassword
                            }
                        }
                    });

                } else {
                    err.success = false;
                    res.status(500).send(err);
                }
            });
        });

    };

    /**
     * Sends emails related to password reset
     */
    let sendEmail = (emailType, to, emailSubject, htmlBody, callback) => {

        //single connection SMTP options
        let smtpConfig = {
            host: config.mail.host,
            port: config.mail.port,
            secure: config.mail.secure,
            auth: {
                //Takes string emailType which determines which mail config user/pass is pulled in
                user: config.mail[emailType].user,
                pass: config.mail[emailType].pass
            }
        };

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(smtpConfig);

        // setup email data with unicode symbols
        let mailOptions = {
            from: config.mail[emailType].from, // sender address
            to: to, // list of receivers comma delimited
            replyTo: config.mail[emailType].replyTo,
            subject: emailSubject, // Subject line
            // text: 'Blah blah blah', // plain text body
            html: htmlBody // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                callback(err);
            } else {
                callback(null, info);
            }
        });

    };

    /**
     * Handle user request for a reset email and create a unique token assigned to their account if they are in the DB.
     */
    let sendResetEmail = (req, res) => {
        let UID;
        if (!req.body.data || !req.body.data.UID) {
            // if no data or data does not contain the email return success false
            res.status(400).json({success: false, message: 'An User ID is required to request a password reset'});
        } else {
            UID = req.body.data.UID;
            console.log('Search for: ' + UID);
            authenticationModel.findUserByUID(UID, (err, user) => {
                if (err) {
                    res.status(err.code).json({success: false, message: err.message});
                } else if (!user) {
                    //make the user think an email has been sent out even if it doesn't exist for security reasons
                    console.log('No user found');
                    res.status(202).json({
                        success: true,
                        message: 'An email has been send with instructions to reset the password.'
                    });
                } else {
                    console.log('User found');
                    // console.log(user);

                    //generate 50 character resetToken and current moment
                    let resetToken = crypto.randomBytes(64).toString('hex').slice(0, 50);
                    let now = moment().format();

                    authenticationModel.addResetFields(user.UID, resetToken, now, (err, success) => {
                        if (err) {
                            res.status(err.code).json({success: false, message: err.message, err: err});
                        } else {
                            //TODO use first and last name in email
                            //Generate email HTML and text
                            let resetLink = 'http://www.' + config.domain + '/api/auth/reset_password/' + resetToken;

                            //Email header
                            let htmlBody = '<h1>Aloha ' + user.FirstName + ' ' + user.LastName + ',</h1>';

                            //Button to reset user password
                            let resetBtn = '<div><!--[if mso]> <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="10%" strokecolor="#1e3650" fillcolor="#ff8a0f"> <w:anchorlock/> <center style="color:#ffffff;font-family:sans-serif;font-size:13px;font-weight:bold;">RESET MY PASSWORD</center> </v:roundrect> <![endif]--><a href="' + resetLink + '" style="background-color:#ff8a0f;border:1px solid #1e3650;border-radius:4px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;mso-hide:all;">RESET MY PASSWORD</a></div>';

                            htmlBody += '<p>You recently requested a password reset on your REALTORS Association of Maui IDX administrative account.</p>' + resetBtn +
                                '<p>If you did not request a password reset, please ignore this email. This password reset is only valid for the next 10 minutes.</p>' +
                                '<p>Mahalo,</p><p>The REALTORS Association of Maui team</p>';

                            //Footer
                            htmlBody += '<hr><i>If you are having trouble clicking the password reset button, copy and paste the URL below into your web browser.</i></br>' +
                                '<i><a href="' + resetLink + '">' + resetLink + '</a></i>';

                            sendEmail('reset', 'shanetajima@gmail.com', 'RAM IDX Password Reset Request', htmlBody, (err, info) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('Message %s sent: %s', info.messageId, info.response);
                                }
                            });

                            res.status(202).json({
                                success: true,
                                message: 'An email has been send with instructions to reset the password.'
                            });
                        }
                    });
                }
            });
        }

    };

    /**
     * Check to see if the token has not expired. Returns boolean.
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
    let renderResetForm = (req, res) => {
        console.log('reset token: ' + req.params.resetToken);
        authenticationModel.getUserWithToken(req.params.resetToken, (err, rows) => {
            if (err) {
                console.log(err);
                res.render('password_reset', {
                    error: 'There was an error when attempting to validate your account.',
                    disableForm: 'disabled'
                });
            } else if (rows.length > 0) {
                let user = rows[0];
                //A user was found
                /*jshint camelcase: false */
                if (isTokenValid(user.Reset_request_date)) {
                    console.log('User found. Token valid. Sending password reset form.');
                    res.render('password_reset');
                } else {
                    //token expired
                    res.render('password_reset', {
                        error: 'This link is not valid or may have expired. Please request another reset.',
                        disableForm: 'disabled'
                    });
                }
            } else {
                //No users found
                res.render('password_reset', {
                    error: 'This link is not valid or may have expired. Please request another reset.',
                    disableForm: 'disabled'
                });
            }
        });

    };

    /**
     * Handle reset password form submission
     */
    let passwordFormSubmit = (req, res) => {
        let user;

        /**
         * Change the users password
         */
        let changeUserPassword = () => {
            generateHash(req.body.password1, (generatedHash) => {
                authenticationModel.updateHash(generatedHash, req.params.resetToken, (err, result) => {
                    if (err) {
                        err.success = false;
                        res.status(err.code).json(err);
                    } else {
                        let htmlBody = '<h1>Hi ' + user.DBID + ',</h1>';

                        htmlBody += '<p>This email is to confirm the password change on your REALTORS Association of Maui IDX administrative account.</p>' +
                            '<p>Aloha,</p><p>The REALTORS Association of Maui team</p>';
                        sendEmail('reset', 'shanetajima@gmail.com', 'RAM IDX Password Reset Confirmation', htmlBody, (err, info) => {
                            if (err) {
                                res.status(500).json({
                                    success: true,
                                    code: 500,
                                    message: 'User Password has been changed but there was an error while sending the confirmation email.',
                                    err: err
                                });
                            } else {
                                res.status(200).json({
                                    success: true,
                                    code: 200,
                                    message: 'User Password has been changed and a confirmation email has been sent.'
                                });
                            }
                        });
                    }
                });
            });
        };

        if (!req.body.password1 || !req.body.password2) {
            res.status(400).json({success: false, message: 'Both password fields must be filled'});
            return;
        } else if (req.body.password1 !== req.body.password2) {
            res.status(400).json({success: false, message: 'Password fields must match'});
            return;
        }

        //Check to see if user reset_token is unexpired
        authenticationModel.getUserWithToken(req.params.resetToken, (err, rows) => {
            if (err) {
                err.success = false;
                res.status(err.code).json(err);
                return;
            } else if (rows.length === 0) {
                res.status(500).json({success: false, code: 500, message: 'Could not find user'});
                return;
            }

            user = rows[0];
            /*jshint camelcase: false */
            if (isTokenValid(user.Reset_request_date)) {
                changeUserPassword();
            } else {
                res.status(401).json({success: false, code: 401, message: 'Reset time has expired.'});
            }
        });
    };

    /**
     * Handle logout of a user
     * @param req
     * @param res
     */
    let logout = (req, res) => {
        req.logout();
        res.redirect('/');
    };

    return {
        login: login,
        verify: verify,
        register: register,
        sendResetEmail: sendResetEmail,
        renderResetForm: renderResetForm,
        passwordFormSubmit: passwordFormSubmit,
        logout: logout
    };
};

module.exports = authenticationController;