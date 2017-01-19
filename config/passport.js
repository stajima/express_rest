const passport = require('passport');
const jwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const getConnection = require('../config/connection');
const config = require('./config');

passport.serializeUser((user, done) => {
    done(null, user.DBID);
});

passport.deserializeUser((id, done) => {
    connection.query("SELECT * FROM `DBID` WHERE `DBID` = " + id, (err, rows) => {
        done(err, rows[0]);
    });
});

//set jwt authentication options
// const jwtOptions = {
//     jwtFromRequest: ExtractJwt.fromAuthHeader(),
//     secretOrKey: config.passport.key
// }

// passport.use(new jwtStrategy(jwtOptions, (payload, done) => {
//     console.log(payload);
// }));

//set alternative fields to use instead of passport defaults
const localOptions = {
    usernameField: 'UID',
    passwordField: 'PID'
}

passport.use(new LocalStrategy(localOptions, (UID, PID, done) => {

    getConnection((err, connection) => {
        connection.query("SELECT * FROM `DBID` WHERE `UID` =  '" + UID + "'", (err, rows) => {
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
            if (!rows[0].PID === PID) {
                console.log('Incorrect password');
                return done(null, false, { error: 'Incorrect password' });
            }

            // console.log(rows[0]);
            return done(null, rows[0]);
        });
    });

}));

