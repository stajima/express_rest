let dbidController = function () {

    let dbidModel = require('../models/dbidModel')();

    /**
     * Function for when a get is called on the dbids route.
     * Simple SELECT from the dbids table.
     * If successful it returns the rows in json otherwise sends a 500 status code and the err msg.
     */
    let get = function (req, res) {
        dbidModel.getAllDbids(function (err, rows) {
            if (!err) {
                res.status(201).json(rows);
            } else {
                res.status(500).send(err);
            }
        });
    };

    return {
        get: get
    };

};

module.exports = dbidController;