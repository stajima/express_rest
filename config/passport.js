const passport = require('passport');
const LocalStrategy = require('passport-local');
const connection = require('../config/connection');

passport.serializeUser((user, done) => {
    done(null, user.DBID);
});

passport.deserializeUser((id, done) => {
    connection.query("SELECT * FROM `DBID` WHERE `DBID` = " + id, (err, rows) => {
        done(err, rows[0]);
    });
});

//set alternative fields to use instead of passport defaults
const localOptions = {
    usernameField: 'UID',
    passwordField: 'PID'
}

const localLogin = new LocalStrategy(localOptions, (UID, PID, done) => {
    connection.query("SELECT `DBID` WHERE `UID` =  '" + UID + "'", (err, rows) => {
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
        if (!row[0].PID === PID) {
            console.log('Incorrect password');
            return done(null, false, { error: 'Incorrect password' });
        }

        console.log(row[0]);
        return done(null, row[0]);
    });
});

passport.use(localLogin);

