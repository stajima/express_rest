var dbidModel = function () {

    /**
     * Get a connection from the mysql db pool.
     */
    var getConnection = require('../config/connection');

    /**
     * Gets all dbids from dbids table
     */
    var getAlldbids = function (callback) {

        getConnection(function (err, connection) {
            if (err) {
                callback({ "code": 500, "status": "Error in connection database" });
                return;
            } else {
                console.log('connected as id ' + connection.threadId);
                connection.on('error', function (err) {
                    callback({ "code": 500, "status": "Error in connection database" });
                    return;
                });
            }

            connection.query("SELECT * FROM DBID", function (err, rows) {
                connection.release();
                console.log("Connection released");
                if (!err) {
                    callback(null, rows);
                } else {
                    callback(err);
                }
            });
        });
    }

    return {
        getAlldbids: getAlldbids
    }

}

module.exports = dbidModel;