const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const getConnection = require('../config/connection');
const config = require('./config');
const bcrypt = require('bcrypt');

// passport.serializeUser((user, done) => {
//     console.log('serializeUser');
//     done(null, user.DBID);
// });

// passport.deserializeUser((id, done) => {
//     console.log('deserializeUser');
//     connection.query("SELECT * FROM DBID WHERE DBID = " + id, (err, rows) => {
//         done(err, rows[0]);
//     });
// });

//set jwt authentication options
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeader(),
    secretOrKey: config.passport.key
}

passport.use(new JwtStrategy(jwtOptions, (payload, done) => {
    console.log("JwtStrategy Hit");
    getConnection((err, connection) => {
        connection.query("SELECT * FROM DBID WHERE UID =  '" + payload.UID + "'", (err, rows) => {
            //if theres a SQL error
            if (err) {
                console.log(err);
                return done(err, false);
            }
            //if a user is found 
            if (rows && rows[0]) {
                done(null, rows[0]);
            } else {
                //if no user is found
                console.log('false');
                done(null, false);
            }
        });
    });

}));

//set alternative fields to use instead of passport defaults
const localOptions = {
    usernameField: 'UID',
    passwordField: 'Password'
}

passport.use(new LocalStrategy(localOptions, (UID, Password, done) => {
    getConnection((err, connection) => {
        //Query style to prevent SQL injection
        let query = 'SELECT * FROM DBID WHERE UID = ' + connection.escape(UID);
        connection.query(query, (err, rows) => {
            connection.release();
            //return if err
            if (err) {
                console.log(err);
                return done(err);
            }
            //if no results found then return with error msg
            if (!rows.length) {
                console.log('No user found');
                return done(null, false, { error: 'No user found' });
            }
            //if user is found but password does not match return with msg
            bcrypt.compare(Password, rows[0].Hash, function (err, res) {
                if (err) {
                    console.log('bcrypt err while checking password');
                    return done(null, false, { error: 'Incorrect password' });
                }
                if (res === false) {
                    console.log('Incorrect password');
                    return done(null, false, { error: 'Incorrect password' });
                }
            });
            
            // console.log(rows[0]);
            return done(null, rows[0]);
        });
    });

}));

