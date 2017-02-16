let express = require('express');
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', {session: false});

let routes = function () {
    let dbidRouter = express.Router();
    let dbidController = require('../controllers/dbidController')();

    /*
     * If root route of /api/dbids is requested use the dbidController get method.
     */
    dbidRouter.get('/', requireAuth, dbidController.get);

    return dbidRouter;
};

module.exports = routes;