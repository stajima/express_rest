var express = require('express');

var routes = function () {
    var authenticationRouter = express.Router();
    var authenticationController = require('../controllers/authenticationController')();

    /*
     * If root route of /api/Agents is requested use the agentController get method.
    */
    authenticationRouter.route('/').get(authenticationController.login);

    return authenticationRouter;
};

module.exports = routes;