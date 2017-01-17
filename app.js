var express = require('express');
var logger = require('morgan');

var app = express();

/**
 * Setting up basic middleware for all Express requests
 */
app.use(logger('dev')); // Log requests to API using morgan

/*
 * Use Gulp set port. Use port 3000 as backup.
 */
var port = process.env.port || 3000;

/*
 * Require and use the agentRouter if path requested is /api/Agents.
 */
var agentRouter = require('./routes/agentRoutes')();
app.use('/api/Agents', agentRouter);

/*
 * Send Welcome string if root url is requested.
 */
app.get('/', function (req, res) {
    res.send('Welcome');
});

/*
 * Start express server.
 */
app.listen(port, function () {
    console.log('Gulp is running on port ' + port);
}); 