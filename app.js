const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const passport = require('passport');
const authenticationController = require('./controllers/authenticationController');

const app = express();

/**
 * Setting up basic middleware for all Express requests
 */
app.use(logger('dev')); // Log requests to API using morgan
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/*
 * Use Gulp set port. Use port 3000 as backup.
 */
const port = process.env.port || 3000;

/*
 * Send Welcome string if root url is requested.
 */
app.get('/', function (req, res) {
    res.send('Welcome');
});

/*
 * Require and use the agentRouter if path requested is /api/Agents.
 */
const agentRouter = require('./routes/agentRoutes')();
app.use('/api/Agents', agentRouter);

/**
 * Require and use authenticationController.login if requested route is /login
 */
const requireLogin = passport.authenticate('local', { session: false });
const authenticationRouter = require('./routes/authenticationRoutes')();
app.post('/login', requireLogin, authenticationRouter);

/*
 * Start express server.
 */
app.listen(port, function () {
    console.log('Gulp is running on port ' + port);
}); 