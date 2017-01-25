let authenticationModel = () => {

    /**
     * Used to get a connection from the mysql db pool.
     */
    const getConnection = require('../config/connection');

    /**
     * Add new user to the DB
     */
    let addNewUser = (newUser, callback) => {

        getConnection((err, connection) => {
            /**
             * If there's an error while getting a connection then pass back 
             * a status of 500 and with an error message. If at any time there is a DB connection 
             * error then do the same.
             */
            if (err) {
                callback({ code: 500, status: "Error in connection database" });
                return;
            } else {
                console.log("connected as id " + connection.threadId);
                connection.on('error', (err) => {
                    callback({ code: 500, status: "Error in connection database" });
                    return;
                })
            }

            /**
            * Create insert statement add all keys/colummns onto query
            */
            let query = "INSERT INTO DBID (" + Object.keys(newUser).join(", "); + ") ";
            let values = "VALUES (";

            /**
             * Add all values with escape() to prevent injection
             */
            for (let prop in newUser) {
                values += connection.escape(newUser[prop]);
            }

            query += ");";

            console.log(query);

            /**
             * Insert new user in the db then return the err or result to the callback.
             */
            connection.query(query, (err, rows) => {
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
        addNewUser: addNewUser
    }
}

module.exports = authenticationModel;

