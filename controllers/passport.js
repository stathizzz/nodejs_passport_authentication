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
var passport = require("passport"),
    LocalStrategy = require('passport-local').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    TwitterStrategy = require('passport-twitter').Strategy,
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    UserController = require('./userauth');

module.exports = function (config, model) {

    passport.serializeUser(function(user, done) {
        if (user.length > 0)
            done(null, user[0].local_ID);
        else
            done(null, user.local_ID);
    });

    passport.deserializeUser(function(local_ID, done) {
        model.getOne('authentication', { local_ID: local_ID }, function (err, user) {
            done(err, user);
        });
    });

  	passport.use(new LocalStrategy(
            function(username, password, done) {
                UserController.isValidLocalUser(model, config, username, password, function(err, user, content) {
                if (err) { return done(err); }

                if (!user) {
                    console.log("local profile" + JSON.stringify(content));
                    return done(null, false, content);
                }

                user.provider = config.app.provider;
                return done(null, user);
            });
        }
    ));

	passport.use(new FacebookStrategy({
            clientID: config.facebook.clientID,
            clientSecret: config.facebook.clientSecret,
            callbackURL: config.facebook.callbackURL
            },
            function(accessToken, refreshToken, profile, done) {
                model.getOne('authentication', {id : profile.id, provider: profile.provider}, function(err, user){
                    if(err) throw err;
                    // if (err) return done(err);
                    if(user){
                        return done(null, user);
                    }else{
                        model.insert('authentication', { id: profile.id,
                                provider: profile.provider,
                                emails: profile.emails,
                                name: profile.username,
                                displayName:  profile.displayName,
                                gender: profile.gender,
                                profileUrl: profile.profileUrl,
                                hometown: profile._json.hometown,
                                location: profile._json.location,
                                timezone: profile._json.timezone,
                                locale: profile._json.locale
                            }
                            , function(err, user){
                                if(err) throw err;
                                // if (err) return done(err);
                                return done(null, user);
                            });
                    }
                });}
    ));

    passport.use(new TwitterStrategy({
            consumerKey:  config.twitter.clientID,
            consumerSecret: config.twitter.clientSecret,
            callbackURL: config.twitter.callbackURL
            },
            function(token, tokenSecret, profile, done) {
                model.getOne('authentication', { id: profile.id, provider: profile.provider }, function (err, user) {
                    if (err) throw err;
                    if (!user) {
                        model.insert('authentication', { id: profile.id,
                                provider: profile.provider,
                                emails: profile.emails,
                                username: profile.username,
                                displayName: profile.displayName,
                                photos: profile.photos
                            },
                            function(err, user) {
                                if (err) throw err;
                                return done(err, user);
                            });
                    }
                });
            }
    ));

    passport.use(new GoogleStrategy({
            clientID: config.google.clientID,
            clientSecret: config.google.clientSecret,
            callbackURL: config.google.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {

            model.getOne('authentication', { id: profile.id, provider: profile.provider }, function (err, user) {
                        if (err) throw err;
                        if (!user) {
                           model.insert('authentication', { id: profile.id,
                                    provider: profile.provider,
                                    name: profile.name,
                                    emails: profile.emails
                                },
                                function(err, user) {
                                    if (err) throw err;
                                    return done(err, user);
                                });
                        }
                        else
                            return done(err, user);
                });
    }));
}
