let mysql = require('mysql');
let mysqlConfig = require('./config').mysql;

let pool = mysql.createPool({
    connectionLimit: mysqlConfig.connectionLimit,
    host: mysqlConfig.host,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    database: mysqlConfig.database,
    debug: mysqlConfig.debug
});

let getConnection = function (callback) {
    pool.getConnection(function (err, connection) {
        callback(err, connection);
    });
};

module.exports = getConnection;
