/*
 Copyright (c) 2003-2013, Efstathios D. Sfecas  <stathizzz@gmail.com>
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
  fs = require('fs'),
  http = require('http'),
  path = require('path'),
  model = new (require('./models/ContentModel')),
  passport = require("passport"),
  flash = require("connect-flash"),
  stylus = require('stylus'),
  bootstrapper = require('./config/bootstrapper');


var models_dir = __dirname + '/models';
fs.readdirSync(models_dir).forEach(function (file) {
  if(file[0] === '.') return; 
  require(models_dir+'/'+ file);
});


var app = express();


app.configure(function () {

    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    /* enable stylus css editor */
    app.use(stylus.middleware(path.join(__dirname, 'public')));
    app.use(express.favicon());
    /* enable logger */
    app.use(express.logger('dev'));
    /* enable cookies on browser */
    app.use(express.cookieParser());
    /* enable html body parsing */
    app.use(express.bodyParser());
    /* enable session on server memory */
    app.use(express.session({ secret: 'keyboard cat', maxAge: 360*5 }));
    /* enable paspport authentication */
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.methodOverride());
    app.use(flash());
    /* enable router */
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));


});

app.configure('development', function () {
  app.use(express.errorHandler());
});


app.use(function(err, req, res, next){
  res.status(err.status || 500);
  res.render('500', { error: err });
});

app.use(function(req, res, next){
  res.status(404);
  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }
  res.type('txt').send('Not found');
});

bootstrapper.bootstrap(app, function(err, settings) {

    model.initDB(settings, function(err, con) {
        if (err) throw err;
        http.createServer(app).listen(app.get('port'), function () {
            console.log("Express server listening on port " + app.get('port'));
            require('./controllers/passport')(settings, model);
            var attachStaff = function(req, res, next) {
                req.model = model;
                req.settings = settings;
                if (next) next();
            };
            require('./routes/routes')(attachStaff, app);
        });

    });
});

