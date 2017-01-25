var express = require('express');
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });

var routes = function () {
    var agentRouter = express.Router();
    var agentController = require('../controllers/agentController')();

    /*
     * If root route of /api/Agents is requested use the agentController get method.
    */
    agentRouter.get('/', requireAuth, agentController.get);

    return agentRouter;
};

module.exports = routes;