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
var MongoClient = require('mongodb').MongoClient,
    hash = require('../../util/hash'),
    passport = require('passport'),
    _ = require('underscore');


module.exports = {
    isAuthenticated : function (req, res, next) {
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

            if (!user) {
                req.error = info.message;
                if (next) return next();
            }

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
    authenticateFacebookUser: function(req, res, next) {
        passport.authenticate("facebook", {failureRedirect: '/account/login', scope : "email"})(req, res, function (err) {
            if (err) {
                console.log(err);
                req.error = "REQ_NOT_AUTH";
            }
            if (next) next();
        });
    },
    authenticateTwitterUser: function(req, res, next) {
        passport.authenticate("twitter", { failureRedirect: '/account/login',  scope : "email"})(req, res, function (err) {
            if (err) {
                console.log(err);
                req.error = "REQ_NOT_AUTH";
            }
            if (next) next();
        });
    },
    authenticateGoogleUser: function(req, res, next) {
        passport.authenticate("google", {failureRedirect: '/account/login', scope: 'openid email'})(req, res, function (err) {
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
                        value: req.body.email
                    }
                },
                provider: req.settings.app.provider
            },
            function (err, count) {
                if (count === 0) {
                    if (next) next();
                } else {
                    console.log("user with email " + req.body.email + ' exists locally!');
                    req.error = "REQ_USER_EXISTS";
                    res.send('email-taken', 400);
                }
        });
    },
    signupLocalUser:  function(model, config, fullname, country, nickname, email, password, done){
        hash(password, function(err, salt, hash){
            if(err) throw err;
            // if (err) return done(err);
            var db_data =  { provider: config.app.provider,
                            emails : [{ value:email}],
                            salt : salt,
                            hash : hash.toString('base64')};
            if (nickname) db_data['nickname'] = nickname;
            if (fullname) db_data['fullname'] = fullname;
            if (country) db_data['country'] = country;

            model.insert('authentication', db_data, function(err, user){
                if(err) throw err;
                // if (err) return done(err);
                if (done) return done(null, user);
            });
        });
    },
    isValidLocalUser : function(model, config, email, password, done) {
        model.getOne('authentication',
            {   emails: {
                    $elemMatch: {
                        value: email
                    }
                },
                provider: config.app.provider
            }, function(err, user){
            // if(err) throw err;
            if(err) {return done(err);}
            if(!user) {
                return done(null, false, { message : 'REQ_INCORRECT_EMAIL' });
            }
            hash(password, user.salt, function(err, hash){
                if(err) return done(err);
                if(hash.toString('base64') == user.hash) {return done(null, user);}
                if (done) return done(null, false, {
                    message : 'REQ_INCORRECT_PWD'
                });
            });
        });
    },
    findLocalUser: function(req, res, next) {
        module.exports.isValidLocalUser(req.model, req.settings, req.body.email, req.body.password, function(err, user, content) {
            if (err) { if (next) return next(err); }

            if (!user) {
                console.log("local profile is " + JSON.stringify(content));
                if (next) return next(null, false, content);
            }
            req.user = user;
            if (next) next(null, user, content);
        });
    },
    getLocalAccountByEmail : function(model, config, email, callback) {
        model.getOne('authentication', {
                emails: {
                    $elemMatch: {
                        value: email
                    }
                },
                provider: config.app.provider
            }, function(err, o){
                if (callback) callback(err, o);
        });
    },
    updateLocalAccount : function(model, config, id, newData, callback) {
        model.getOne('authentication', {
            local_ID: id,
            provider: config.app.provider
        }, function(err, o){
            if (err){
                if (callback) callback(err, null);
            } else {
                hash(newData.password, function(err, salt, hash){
                    if(err) {
                        if (callback) return callback(err, null);
                    }
                    var db_data = {
                        salt : salt,
                        hash : hash.toString('base64'),
                        fullname : newData.fullname,
                        country : newData.country
                    };

                    model.updateSpecificFields('authentication', {local_ID: id}, db_data, function(err, user) {
                        if (err || !user) {
                            if (callback) callback(err, null);
                        } else {
                            if (callback) callback(err, user);
                        }
                    });

                });
            }
        });
    },
    updateLocalAccountPassword : function(model, config, id, newPass, callback) {
        model.getOne('authentication', {
            local_ID: id,
            provider: config.app.provider
        }, function(err, o){
            if (err){
                if (callback) callback(err, null);
            } else {
                hash(newPass, function(err, salt, hash){
                    if(err) {
                        if (callback) return callback(err, null);
                    }
                    var db_data =  {
                        salt : salt,
                        hash : hash.toString('base64')
                    };
                    model.updateSpecificFields('authentication', {local_ID: o.local_ID}, db_data, function(err, user) {
                        if (callback) return callback(err, user);
                    });

                });
            }
        });
    },
    deleteAccount : function(model, id, callback) {
        model.removeOne('authentication', {local_ID: id}, callback);
    },
    getAllAccounts : function(model, callback) {
        model.getlist('authentication', {}, function(err, res) {
            if (callback) callback(err, res);
        });
    },
    delAllAccounts : function(model, callback) {
        model.massremove('authentication', {}, callback)
    },
    validateResetLink : function(model, id, callback)
    {
        model.getOne('authentication', { local_ID:id }, function(e, o){
            callback(o ? 'ok' : null);
        });
    },
    setLocalUserCookie: function(req, res, next) {
        /* update the user's login cookies if they exists */
        if (req.cookies.user != undefined && req.cookies.pass != undefined){
            res.cookie('user', req.user.emails[0], { maxAge: 900000 });
            //res.cookie('pass', o.pass, { maxAge: 900000 });
        }
        else if (req.param('remember-me') == 'true'){
            res.cookie('user', req.user.emails[0], { maxAge: 900000 });
            //res.cookie('pass', o.pass, { maxAge: 900000 });
        }

        if (next) next();
    },
    destroyLocalUserCookie: function(req, res, next) {
        res.clearCookie('user');
        //res.clearCookie('pass');
        req.session.destroy(function(e){
            if (next) next();
        });
    }
}