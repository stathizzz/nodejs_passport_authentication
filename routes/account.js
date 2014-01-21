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
var View = require("./../views/Base"),
    CT = require('./../controllers/account/country-list'),
    UserController = require('./../controllers/account/userauth'),
    email_dispathcer = require('./../controllers/email-dispatcher');

exports.setup_all = function(model, settings, attachStaff, app) {

    app.get("/auth/facebook", UserController.authenticateFacebookUser);
    app.get("/auth/facebook/callback", UserController.authenticateFacebookUser,
        function(req,res) {
            if (req.error == "REQ_NOT_AUTH")
                res.redirect("/account/login");
            else
                res.redirect("/account/settings");
        })

    app.get("/auth/twitter", UserController.authenticateTwitterUser);
    app.get("/auth/twitter/callback", UserController.authenticateTwitterUser,
        function(req,res){
            if (req.error == "REQ_NOT_AUTH")
                res.redirect("/account/login");
            else
                res.redirect("/account/settings");
        }
    );
    app.get("/auth/google",  UserController.authenticateGoogleUser);
    app.get("/auth/google/callback", UserController.authenticateGoogleUser,
        function(req, res) {
            if (req.error == "REQ_NOT_AUTH")
                res.redirect("/account/login");
            else
                res.redirect("/account/settings");
    });

    app.get('/', attachStaff, UserController.isAuthenticated, function(req, res, next){
        if (req.user)
            res.redirect("/account/settings");
        else
            res.redirect("/account/login");
    });
    // main login page //
    app.get('/account/login', attachStaff, UserController.isAuthenticated,  function(req, res, next) {
        if (req.user == null){
            new View(req, res, 'account/login').render({
                email: (req.cookies.user)? req.cookies.user.value : ''
            });
        } else {
            res.redirect("/account/settings");
        }
    });

    app.post('/account/login', attachStaff,  UserController.authenticateLocalUser,  function(req, res, next){
        if (req.user == null) {
            if (req.error == 'REQ_INCORRECT_EMAIL' || req.error == 'REQ_INCORRECT_PWD')
                res.send(req.error, 400);
            else {
                new View(req, res, 'account/login').render({
                    email: req.cookies.user.value
                });
            }
        } else {
            UserController.setLocalUserCookie(req, res, next);
            res.redirect("/account/settings");
        }
    });

    // logged-in user homepage //
    app.get('/account/settings', function(req, res) {

        if (req.user == null) {
            // if user is not logged-in redirect back to login page //
            res.redirect('/');
        }   else {
            new View(req, res, 'account/settings').render({
                title : 'Control Panel',
                countries : CT,
                udata : req.user
            });
        }
    });

    app.post('/account/settings', attachStaff,  UserController.authenticateLocalUser, function(req, res, next) {
        if (req.user) {
            UserController.updateLocalAccount(model, settings, req.user.local_ID, {
                fullname : req.body.fullname,
                country : req.body.country,
                password: req.body.password
            }, function(err, user){
                if (err){
                    console.log("error-updating-account")
                    res.send('error-updating-account', 400);
                } else {
                    UserController.setLocalUserCookie(req, res, function () {
                        res.send('ok', 200);
                    });
                }
                //if (next) next();
            });
        } else if (req.param('logout') == 'true'){
            UserController.destroyLocalUserCookie(req, res, next);
        }
    });

// creating new accounts //
    app.get('/account/signup', function(req, res) {
        new View(req, res, 'account/signup').render({
            countries : CT
        });
    });

    app.post('/account/signup', attachStaff, UserController.existsLocalUser, function(req, res, next){

        UserController.signupLocalUser(req.model, req.settings, req.body.fullname, req.body.country,
            req.body.nickname, req.body.email, req.body.password, function(err, user){
            req.login(user, function(err) {
                if (err) { throw err; }
                return res.redirect('/account/settings');
            });

        });
    });

// password reset //

    app.post('/account/lost-password', function(req, res, next){
        // look up the user's account via their email //
        UserController.getLocalAccountByEmail(model, settings, req.body.email, function(err, o) {
            if (err) throw err;
            if (o) {
                res.send('ok', 200);
                email_dispathcer.sendEmailHandler(app.mailer, req.body.email, {
                    subject: "Request to reset password for symma",
                    body: "",
                    email: req.body.email,
                    link: "http://localhost:3000/account/reset-password?e=" + req.body.email + "&p=" + o.local_ID,
                    symma_link: "http://twitter.com/symma",
                    country: o.country,
                    fullname: o.fullname
                }, next, function (err, m) {
                    if (err){
                        console.log("error while sending email: " + err);
                        res.send('email-server-error', 400);
                    }
                    //for (k in e) console.log('error : ', k, e[k]);
                    console.log("Email has been sent successfully");
                });
            }
            else {
                res.send('email-not-found', 400);
            }
        });
    });

    app.get('/account/reset-password', function(req, res) {
        var email = req.query["e"];
        var passH = req.query["p"];
        UserController.validateResetLink(model, passH, function(e) {
            if (e != 'ok'){
                res.redirect('/');
            } else {
                // save the user's email in a session instead of sending to the client //
                req.session.reset = { email:email, passHash:passH };
                new View(req, res, 'account/reset').render({
                });
            }
        })
    });

    app.post('/account/reset-password', attachStaff, function(req, res, next) {
            var nPass = req.param('pass');
            // retrieve the user's email from the session to lookup their account and reset password //
            //var email = req.session.reset.email;
            var id = req.query["p"];
            // destory the session immediately after retrieving the stored email //
            req.session.destroy();

            UserController.updateLocalAccountPassword(model, settings, id, nPass, function(err, o){
                if (err) throw err;
                if (!o) {
                    res.send('unable to update password', 400);
                    return false;
                }
                req.body.email =  req.query["e"];
                req.body.password = nPass;
                if (next) next();
            });
        }, UserController.authenticateLocalUser, UserController.setLocalUserCookie, UserController.isAuthenticated, function(req, res, next) {
            if (req.user) {
                res.send('ok', 200);
            } else {
                res.send('unable to update password', 400);
            }
        }
    );

// view & delete accounts //

    app.get('/account/print', function(req, res) {
        UserController.getAllAccountss(model, function(e, accounts){
            new View(req, res, 'account/print').render({
                title: lang.language.title,
                accts : accounts });
        })
    });

    app.post('/account/delete', function(req, res, next){
        console.log('req body iud = ' + req.body.id)
        UserController.deleteAccount(model, req.body.id, function(e, obj){
            if (!e){
                UserController.destroyLocalUserCookie(req,res,next);
            } else{
                res.send('record not found', 400);
            }
        });
    });

    app.get('/account/reset', function(req, res) {
        UserController.delAllAccounts(model, function(){
            res.redirect('/account/print');
        });
    });

    /* ------------------------------- from passport file ------------------------------------*/

    app.get('/account/signout', function(req, res, next){
        req.logout();
        res.redirect('/');
    });

};
