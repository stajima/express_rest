var express = require('express');

var app = express();

var port = process.env.port || 3000;

var agentRouter = require('./routes/agentRoutes')();

app.use('/api/Agents', agentRouter);

app.get('/', function (req, res) {
    res.send('Welcome');
});

app.listen(port, function () {
    console.log('Gulp is running on port ' + port);
}); 