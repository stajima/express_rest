var agentModel = function () {

    /**
     * Get a connection from the mysql db pool.
     */
    var getConnection = require('../connection');

    /**
     * Gets all agents from Agents table
     */
    var getAllAgents = function (callback) {

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

            connection.query("SELECT * FROM Agents", function (err, rows) {
                connection.release();
                if (!err) {
                    callback(null, rows);
                } else {
                    callback(err);
                }
            });
        });
    }

    return {
        getAllAgents: getAllAgents
    }

}

module.exports = agentModel;