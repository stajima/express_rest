var express = require('express');

var routes = function () {
    var agentRouter = express.Router();
    var agentController = require('../controllers/agentController');

    agentRouter.route('/').get(agentController.get);

    return agentRouter;
};

module.exports = routes;