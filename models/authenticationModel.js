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
            * Create insert statement add all keys/columns onto query
            */
            let query = "INSERT INTO DBID (" + Object.keys(newUser).join(", ") + ") VALUES (";

            /**
             * Add all values with escape() to prevent injection
             */
            let cleanedValues = [];
            for (let prop in newUser) {
                if (newUser.hasOwnProperty(prop)) {
                    cleanedValues.push(connection.escape(newUser[prop]));
                }
            }

            query += cleanedValues + ");";

            // console.log(query);

            /**
             * Inserts a new user in the db then return the err or result to the callback.
             */
            connection.query(query, (err, result) => {
                connection.release();
                console.log("Connection released");
                if (!err) {
                    console.log("New user added to the DB.");
                    callback(null, result);
                } else {
                    console.log(err);
                    callback(err);
                }
            });

        });
    }

    /**
     * Finds user in the DB using email.
     */
    let findUserByEmail = (email, callback) => {

        getConnection((err, connection) => {
            /**
             * If there's an error while getting a connection then pass back 
             * a status of 500 and with an error message. If at any time there is a DB connection 
             * error then do the same.
             */
            if (err) {
                callback({ code: 500, messsage: "Error in connection database" });
                return;
            } else {
                console.log("connected as id " + connection.threadId);
                connection.on('error', (err) => {
                    callback({ code: 500, message: "Error in connection database" });
                    return;
                })
            }

            let query = "SELECT * FROM DBID WHERE Email = " + connection.escape(email);
            connection.query(query, (err, rows) => {
                connection.release();
                console.log("Connection released");
                if (err) {
                    console.log(err);
                    callback({ code: 500, message: err });
                } else {
                    callback(null, rows[0]);
                }
            });
        });

    }

    /**
     * Adds resetToken and resetDate to the user in the DB using email. Returns true if sucessful.
     */
    let addResetFields = (userEmail, resetToken, resetDate, callback) => {

        getConnection((err, connection) => {

            /**
             * If there's an error while getting a connection then pass back 
             * a status of 500 and with an error message. If at any time there is a DB connection 
             * error then do the same.
             */
            if (err) {
                console.log(err);
                callback({ code: 500, status: "Error in connection database" });
                return;
            } else {
                console.log("connected as id " + connection.threadId);
                connection.on('error', (err) => {
                    callback({ code: 500, message: "Error in connection database" });
                    return;
                })
            }

            let query = "UPDATE DBID SET Reset_token = '" + resetToken + "', Reset_request_date = '" + resetDate + "' WHERE Email = '" + userEmail + "';";
            console.log(query);
            connection.query(query, (err, rows) => {
                connection.release();
                if (err) {
                    console.log(err);
                    callback({ code: 500, message: "Error in connection database" });
                } else {
                    callback(null, true);
                }
            });
        });

    }

    return {
        addNewUser: addNewUser,
        findUserByEmail: findUserByEmail,
        addResetFields: addResetFields
    }
}

module.exports = authenticationModel;

