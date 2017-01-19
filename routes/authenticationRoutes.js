const express = require('express');

const routes = function () {
    let authenticationRouter = express.Router();
    let authenticationController = require('../controllers/authenticationController')();

    /*
     * If root route is requested use the authenticationController get method.
    */
    authenticationRouter.route('/').post(authenticationController.login);

    return authenticationRouter;
};

module.exports = routes;