var agentController = function () {
    /**
     * Get a connection from the mysql db pool.
     */
    var getConnection = require('../connection');

    /**
     * Function for when a get is called on the agents route.
     * Simple SELECT from the Agents table.
     * If succesful it returns the rows in json otherwise sends a 500 status code and the err msg.
     */
    var get = function (req, res) {
        getConnection(function (err, connection) {
            connection.query("SELECT * FROM Agents LIMIT 1", function (err, rows) {
                connection.release();
                if (!err) {
                    res.json(rows);
                } else {
                    res.status(500).send(err);
                }
            });
        });
    }

    return {
        get: get
    }

}

module.exports = agentController;