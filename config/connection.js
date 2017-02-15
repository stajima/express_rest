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
        /**
         * If there's an error while getting a connection then pass back
         * a status of 500 and with an error message. If at any time there is a DB connection
         * error then do the same.
         */
        if (err) {
            callback({code: 500, message: "Error in connection database"});
            return;
        } else {
            console.log("connected as id " + connection.threadId);
            connection.on('error', (err) => {
                callback({code: 500, message: "Error in connection database", err: err});
            });
        }
        callback(err, connection);
    });
};

module.exports = getConnection;
