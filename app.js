const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const passport = require('passport');
const handlebars = require('express-handlebars');

/**
 * PassportService included for later use in other files.
 * By including it here it doesn't need to be included in every file it's used in.
 */
const passportService = require('./config/passport');

const app = express();

/**
 * Middleware
 */
app.use(logger('dev')); // Log requests to API using morgan
app.use(bodyParser.urlencoded({extended: true})); //support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.json()); //support parsing of application/json type post data
app.use(passport.initialize());
app.set('views', './views');
app.engine('.hbs', handlebars({extname: '.hbs'}));
app.set('view engine', '.hbs');

/**
 * Use Gulp set port. Use port 3000 as backup.
 */
const port = process.env.port || 3000;

/**
 * Send Welcome string if root url is requested.
 */
app.get('/', function (req, res) {
    res.send('Welcome');
});

/**
 * Require and use the dbidRouter if path requested is /api/dbids.
 */
const dbidRouter = require('./routes/dbidRoutes')();
app.use('/api/dbids', dbidRouter);

/**
 * Route for /api/authentication
 */
const authenticationRouter = require('./routes/authenticationRoutes')();
app.use('/api/auth', authenticationRouter);

app.get('/password_reset', (req, res) => {
    if (true) {
        console.log('User found. Token valid. Sending password reset form.');
        res.render('password_reset');
    }
    if (false) {
        //token expired
        res.render('password_reset', {
            error: 'This link is not valid or may have expired. ' +
            'Please request another reset or contact us if you believe this to be in error',
            disableForm: 'disabled'
        });
    }
    if (false) {
        //No users found
        res.render('password_reset', {
            error: 'This link is not valid or may have expired. ' +
            'Please request another reset or contact us if you believe this to be in error--',
            disableForm: 'disabled'
        });
    }
});

/**
 * Start express server.
 */
app.listen(port, function () {
    console.log('Gulp is running on port ' + port);
});