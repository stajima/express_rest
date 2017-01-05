var mysql = require('mysql');
var mysql = require('./config').mysql;

var pool = mysql.createPool({
    connectionLimit: config.connectionLimit,
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    debug: config.debug
});

var getConnection = function (callback) {
    pool.getConnection(function (err, connection) {
        connection.on('error', function (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        });
        callback(err, connection);
    });
};

module.exports = getConnection;
