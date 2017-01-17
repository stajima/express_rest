var express = require('express');

var routes = function () {
    var agentRouter = express.Router();
    var agentController = require('../controllers/agentController')();

    /*
     * If root route of /api/Agents is requested use the agentController get method.
    */
    agentRouter.route('/').get(agentController.get);

    return agentRouter;
};

module.exports = routes;