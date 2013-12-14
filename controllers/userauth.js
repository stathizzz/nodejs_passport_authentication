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
var MongoClient = require('mongodb').MongoClient,
    hash = require('../util/hash'),
    passport = require('passport');


module.exports = {
    isAuthenticated : function (req, res, next){
        if(req.isAuthenticated()){
            if (next) return next();
        }else{
            req.error = 'REQ_NOT_AUTH';
            if (next) return next();
        }
    },
    authenticateLocalUser: function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) {
                req.error = err;
                if (next) return next();
            }
            if (!user) { return res.redirect('/login'); }
            req.logIn(user, function(err) {
                if (err) {
                    req.error = err;
                    if (next) return next();
                }
                req.error = null;
                if (next) return next();
            });
        })(req, res, next);
    },
    authenticateFacebookUser: function(req, res, next)
    {
        passport.authenticate("facebook", {failureRedirect: '/login', scope : "email"})(req, res, function (err) {
            if (err) {
                console.log(err);
                req.error = "REQ_NOT_AUTH";
            }
            if (next) next();
        });
    },
    authenticateTwitterUser: function(req, res, next)
    {
        passport.authenticate("twitter", { failureRedirect: '/login',  scope : "email"})(req, res, function (err) {
            if (err) {
                console.log(err);
                req.error = "REQ_NOT_AUTH";
            }
            if (next) next();
        });
    },
    authenticateGoogleUser: function(req, res, next)
    {
        passport.authenticate("google", {failureRedirect: '/login', scope: 'openid email'})(req, res, function (err) {
            if (err) {
                console.log(err);
                req.error = "REQ_NOT_AUTH";
            }
            if (next) next();
        });
    },
    existsLocalUser : function(req, res, next) {
        req.model.count('authentication', {
                emails: {
                    $elemMatch: {
                        value: req.body.username
                    }
                },
                provider: req.settings.app.provider
            },
            function (err, count) {
                if (count === 0) {
                    if (next) next();
                } else {
                    console.log("user " + req.body.username + ' exists locally!');
                    res.redirect("/signup");
                }
        });
    },
    signupLocalUser:  function(model, config, email, password, done){
        hash(password, function(err, salt, hash){
            if(err) throw err;
            // if (err) return done(err);
           model.insert('authentication', {
                   provider: config.app.provider,
                   emails : [{ value:email}],
                   salt : salt,
                   hash : hash.toString('base64')
               }, function(err, user){
                   if(err) throw err;
                   // if (err) return done(err);
                   if (done) return done(null, user);
           });
        });

    },
    isValidLocalUser : function(model, config, username, password, done) {
        model.getOne('authentication',
            {   emails: {
                    $elemMatch: {
                        value: username
                    }
                },
                provider: config.app.provider
            }, function(err, user){
            // if(err) throw err;
            if(err) {return done(err);}
            if(!user) {return done(null, false, { message : 'Incorrect email.' });}
            hash(password, user.salt, function(err, hash){
                if(err) return done(err);
                if(hash.toString('base64') == user.hash) {return done(null, user);}
                if (done) return done(null, false, {
                    message : 'Incorrect password'
                });
            });
        });
    }
}