var agentController = function () {

    var agentModel = require('../models/agentModel')();

    /**
     * Function for when a get is called on the agents route.
     * Simple SELECT from the Agents table.
     * If succesful it returns the rows in json otherwise sends a 500 status code and the err msg.
     */
    var get = function (req, res) {
        agentModel.getAllAgents(function (err, rows) {
            if (!err) {
                res.status(201).json(rows);
            } else {
                res.status(500).send(err);
            }
        });
    }

    return {
        get: get
    }

};

module.exports = agentController;