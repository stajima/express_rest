var mysql = require('mysql');
var mysqlConfig = require('./config').mysql;

var pool = mysql.createPool({
    connectionLimit: mysqlConfig.connectionLimit,
    host: mysqlConfig.host,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    database: mysqlConfig.database,
    debug: mysqlConfig.debug
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
