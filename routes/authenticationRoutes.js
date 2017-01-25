const express = require('express');
const passport = require('passport');
const requireLogin = passport.authenticate('local', { session: false });
const requireAuth = passport.authenticate('jwt', { session: false });

/**
 * Routes reguarding /api/auth
 */
const routes = function () {
    let authenticationRouter = express.Router();
    let authenticationController = require('../controllers/authenticationController')();

    /*
     * If POST /login is requested use the authenticationController login method.
    */
    authenticationRouter.post('/login', requireLogin, authenticationController.login);


    /** 
     * GET Dashboard route protected by JWT
    */
    authenticationRouter.get('/dashboard', requireAuth, authenticationController.verify);

    return authenticationRouter;
};

module.exports = routes;