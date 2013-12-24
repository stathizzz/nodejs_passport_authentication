/*
 Copyright (c) 2013-2014, Efstathios D. Sfecas  <stathizzz@gmail.com>
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var express = require('express'),
    http = require('http'),
    path = require('path'),
    url = require('url'),
    fs = require('fs'),
    stylus = require('stylus'),
    flash = require("connect-flash"),
    model = require('./models/ContentModel'),
    View = require("./views/Base"),
    bootstrapper = require('./config/bootstrapper'),
    mailer = require('express-mailer'),
    passport = require("passport");

var app = express();

var MemStore = express.session.MemoryStore;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
/* enable jade */
app.set('view engine', 'jade');
/* enable stylus css editor */
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.favicon());
/* enable logger */
app.use(express.logger('dev'));
/* enable cookies on browser */
app.use(express.cookieParser());
/* enable session on server memory */
app.use(express.session({ secret: "keyboard cat", maxAge: 360*5, store: MemStore({
    reapInterval: 60000 * 10
})}));
/* enable html body parsing */
app.use(express.bodyParser());
/* enable paspport authentication */
app.use(passport.initialize());
app.use(passport.session());
/* enable PUT and DELETE requests to be parsed on client*/
app.use(express.methodOverride());
app.use(flash());
/* enable router */
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}
/* Error page handling when router fails */
app.use (function (req, res) {
    new View(req, res, 'error').render({
        msg: "Page not found!"
    });
});

bootstrapper.bootstrap(app, function(err, settings) {

    mailer.extend(app, {
        from: settings.email.from,
        host: settings.email.host, // hostname
        secureConnection: settings.email.secureConnection, // use SSL
        port: settings.email.port, // port for secure SMTP
        transportMethod: settings.email.transportMethod, // default is SMTP. Accepts anything that nodemailer accepts
        auth: {
            user: settings.email.auth.user,
            pass: settings.email.auth.pass
        }
    });

    model.initDB(settings, function(err, db) {
        if (err) throw err;
        http.createServer(app).listen(app.get('port'), function () {
            console.log(
                'Successfully connected to ' + settings.mongo.db_name,
                '\nExpress server listening on port ' + settings.port
            );
            require('./controllers/account/passport')(model, settings);
            //routes binder
            var attachStaff = function(req, res, next) {
                req.model = model;
                req.settings = settings;
                if (next) next();
            };
            require('./routes/account').setup_all(model, settings, attachStaff, app);
            console.log("Successfully setup Routes !");
        });
    });
});

