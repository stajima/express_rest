let authenticationModel = () => {

    /**
     * Used to get a connection from the mysql db pool.
     */
    const getConnection = require('../config/connection');

    /**
     * Create an insert statement for when a new user is added
     */
    let createInsertStatement = (newUser, connection) => {
        //TODO cyclomatic complexity?
        //Columns in the tables
        let validAgentsColumns = ['AgentID', 'SS', 'FirstName', 'LastName', 'Middle', 'MemberClass', 'BillingClass', 'Specialty',
            'NickName', 'Add1', 'Add2', 'City', 'State', 'Zip', 'Des', 'Phone', 'Cell', 'OfficeID', 'OfficeName', 'OfficeAdd1',
            'OfficeAdd2', 'OfficeCity', 'OfficeState', 'OfficeZip', 'OfficePhone', 'OfficeFax', 'Email1', 'Email2', 'WebPage',
            'UseEmail', 'Member'];
        let validAuthColumns = ['UID', 'Hash', 'Reset_token', 'Reset_request_date'];
        let validDbidColumns = ['DBID', 'CVendor', 'CAgent', 'CBroker', 'Other', 'Comments', 'ID', 'UID', 'PID', 'Email',
            'Admin', 'NoCount', 'Domains', 'UserType', 'DataType', 'FeedType', 'FTPDirectory', 'FTPFrequency', 'FTPFilter',
            'FTPImages', 'FTPCustom', 'FontFamily', 'FontSizeBody', 'FontSizeHead', 'HeadColor', 'BodyColor', 'BodyColor2',
            'HeadFontColor', 'BodyFontColor', 'BodyFontColor2', 'HeaderFile', 'FooterFile', 'TableWidth', 'TableAlign', 'LinkColor',
            'VisitedColor', 'HoverColor', 'BGColor', 'BGImage', 'LogoImage', 'MainLink', 'StyleLink', 'ThumbShow', 'ThumbSize',
            'Question1', 'Question2', 'Question3', 'Question4', 'Question5', 'Question6', 'Question7', 'Question8', 'Question9',
            'Question10', 'PublicRemarks', 'PublicRemarksLocation', 'ExAgency', 'Disable', 'Webmaster', 'TechEmail', 'LocationMaps',
            'OH_Display', 'OH_Filter', 'Solds', 'Tracking', 'ShowListDate', 'MeFirst', 'TaxLink'];

        //Check to see if the key exists in table
        let agentTable = {};
        let authTable = {};
        let dbidTable = {};

        for (let property in newUser) {
            if (newUser.hasOwnProperty(property)) {
                if (validAgentsColumns.indexOf(property) > -1) {
                    agentTable[property] = newUser[property];
                }
                if (validAuthColumns.indexOf(property) > -1) {
                    authTable[property] = newUser[property];
                }
                if (validDbidColumns.indexOf(property) > -1) {
                    dbidTable[property] = newUser[property];
                }
            }
        }

        let agentInsert = "INSERT INTO Agents (" + Object.keys(agentTable).join(", ") + ") VALUES (";
        let cleanedAgentValues = [];
        for (let column in agentTable) {
            if (agentTable.hasOwnProperty(column)) {
                cleanedAgentValues.push(connection.escape(newUser[column]));
            }
        }
        agentInsert += cleanedAgentValues + '); ';

        let authInsert = "INSERT INTO Authentication (" + Object.keys(authTable).join(", ") + ") VALUES (";
        let cleanedAuthValues = [];
        for (let column in authTable) {
            if (authTable.hasOwnProperty(column)) {
                cleanedAuthValues.push(connection.escape(newUser[column]));
            }
        }
        authInsert += cleanedAuthValues + '); ';

        let dbidInsert = "INSERT INTO DBID (" + Object.keys(dbidTable).join(", ") + ") VALUES (";
        let cleanedDbidValues = [];
        for (let column in dbidTable) {
            if (dbidTable.hasOwnProperty(column)) {
                cleanedDbidValues.push(connection.escape(newUser[column]));
            }
        }
        dbidInsert += cleanedDbidValues + '); ';

        return [dbidInsert, agentInsert, authInsert];

    };

    /**
     * Add new user to the DB
     */
    let addNewUser = (newUser, callback) => {

        getConnection((err, connection) => {
            let queryArray = createInsertStatement(newUser, connection);

            /**
             * Inserts a new user in the db then return the err or result to the callback.
             */
            connection.beginTransaction(function (err) {
                //error for beginTransaction
                if (err) {
                    connection.release();
                    console.log("Connection released");
                    console.log(err);
                    callback(err);
                }

                //first query
                connection.query(queryArray[0], function (error, results, fields) {
                    if (error) {
                        connection.release();
                        console.log("Connection released");
                        return connection.rollback(function () {
                            console.log(err);
                            callback(err);
                        });
                    }

                    //second query
                    connection.query(queryArray[1], function (error, results, fields) {
                        //error for second query
                        if (error) {
                            connection.release();
                            console.log("Connection released");
                            return connection.rollback(function () {
                                console.log(err);
                                callback(err);
                            });
                        }

                        //third query
                        connection.query(queryArray[2], function (error, results, fields) {
                            //error for third query
                            if (error) {
                                connection.release();
                                console.log("Connection released");
                                return connection.rollback(function () {
                                    console.log(err);
                                    callback(err);
                                });
                            }

                            //when all the queries are done commit
                            connection.commit(function (err) {
                                connection.release();
                                console.log("Connection released");
                                if (err) {
                                    return connection.rollback(function () {
                                        console.log(err);
                                        callback(err);
                                    });
                                }
                                console.log("New user added to the DB.");
                                callback(null);
                            });
                        });
                    });
                });
            });
        });
    };

    /**
     * Finds user in the DB using email.
     */
    let findUserByUID = (UID, callback) => {

        getConnection((err, connection) => {
            let query = "SELECT DBID.*, Agents.* FROM DBID INNER JOIN Agents ON DBID.UID = Agents.AgentID WHERE UID = " + connection.escape(UID) + ";";
            connection.query(query, (err, rows) => {
                connection.release();
                console.log("Connection released");
                if (err) {
                    console.log(err);
                    callback({code: 500, message: err});
                } else {
                    callback(null, rows[0]);
                }
            });
        });

    };

    /**
     * Adds resetToken and resetDate to the user in the DB using email. Returns true if successful.
     */
    let addResetFields = (UID, resetToken, resetDate, callback) => {

        getConnection((err, connection) => {
            let query = "UPDATE Authentication SET Reset_token = '" + resetToken + "', Reset_request_date = '" + resetDate + "' WHERE UID = '" + UID + "';";
            console.log(query);
            connection.query(query, (err, rows) => {
                connection.release();
                console.log("Connection released");
                if (err) {
                    console.log(err);
                    callback({code: 500, message: "Error in connection database"});
                } else {
                    // console.log(rows);
                    callback(null, true);
                }
            });
        });

    };

    /**
     * Find the user that has the Reset_token
     */
    let getUserWithToken = (token, callback) => {
        console.log('Attempting to find reset_token: ' + token);
        getConnection((err, connection) => {
            let query = 'SELECT * FROM Authentication WHERE Reset_token = ' + connection.escape(token) + ';';
            console.log(query);
            connection.query(query, (err, rows) => {
                connection.release();
                console.log("Connection released");
                if (err && err.errno === 1065) {
                    //Catch ER_EMPTY_QUERY error
                    console.log('ER_EMPTY_QUERY');
                    callback(null, []);
                } else if (err) {
                    //Any other DB err
                    console.log(err);
                    callback({code: 500, message: "Error in connection database", err: err});
                } else {
                    //No errors. Row found.
                    callback(null, rows);
                }
            });

        });
    };

    /**
     * Changes users Hash with new Hash
     */
    let updateHash = (newHash, resetToken, callback) => {

        getConnection((err, connection) => {
            //Change Hash to new password hash and remove reset_token
            let query = 'UPDATE Authentication SET Hash = ' + connection.escape(newHash) + ', Reset_token = NULL ' + 'WHERE Reset_token = ' + connection.escape(resetToken) + ';';
            console.log(query);
            connection.query(query, (err, result) => {
                if (err) {
                    callback({code: 500, err: err, message: 'Failed to reset the password'});
                } else {
                    callback(null, result);
                }
            });

        });

    };

    return {
        addNewUser: addNewUser,
        findUserByUID: findUserByUID,
        addResetFields: addResetFields,
        getUserWithToken: getUserWithToken,
        updateHash: updateHash
    };
};

module.exports = authenticationModel;

