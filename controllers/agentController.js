var getConnection = require('../connection');

var agentController = function () {

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