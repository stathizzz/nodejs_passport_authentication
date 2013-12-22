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
var UserController = require('./../controllers/userauth');


module.exports = function(attachStaff, app){
	app.get("/", UserController.isAuthenticated, function(req, res, next){
        var userdata = {};

        if (req.user) {
            switch(req.user.provider) {
                case 'google':
                    userdata.email = req.user.emails[0].value;
                    userdata.provider = req.user.provider;
                    break;
                case 'facebook':
                    userdata.name = req.user.displayName;
                    userdata.email = req.user.emails[0].value;
                    userdata.provider = req.user.provider;
                    break;
                case 'twitter':
                    userdata.name = req.user.displayName;
                    userdata.provider = req.user.provider;
                    break;
                case 'symma':
                    userdata.email = req.user.emails[0].value;
                    userdata.provider = req.user.provider;
                    break;
            }
            res.render("home", {userdata : userdata});
        }
        else
            res.render("home");
	});

	app.get("/login", function(req, res){ 
		res.render("login");
	});

	app.post("/login" , UserController.authenticateLocalUser, UserController.isAuthenticated, function(req, res, next) {
        if (req.error) {
            throw req.error;
        }
        res.redirect("/profile");
    });

	app.get("/signup", function (req, res) {
		res.render("signup");
	});

	app.post("/signup", attachStaff, UserController.existsLocalUser,  function (req, res, next) {
        UserController.signupLocalUser(req.model, req.settings, req.body.email, req.body.password, function(err, user){
            req.login(user, function(err) {
                if (err) { if (next) return next(err); }
                return res.redirect('/profile');
            });

        });
	});

	app.get("/auth/facebook", UserController.authenticateFacebookUser);
    app.get("/auth/facebook/callback", UserController.authenticateFacebookUser,
        function(req,res) {
            if (req.error == "REQ_NOT_AUTH")
                res.redirect("/login");
            else
                res.redirect("/profile");
        })

    app.get("/auth/twitter", UserController.authenticateTwitterUser);
    app.get("/auth/twitter/callback", UserController.authenticateTwitterUser,
        function(req,res){
            if (req.error == "REQ_NOT_AUTH")
                res.redirect("/login");
            else
                res.redirect("/profile");
        }
    );
	app.get("/auth/google",  UserController.authenticateGoogleUser);
    app.get("/auth/google/callback", UserController.authenticateGoogleUser,
        function(req, res) {
            if (req.error == "REQ_NOT_AUTH")
                res.redirect("/login");
            else
                res.redirect("/profile");
        });

	app.get("/profile", UserController.isAuthenticated, function(req, res, next){
            if (req.error) console.log("Request error on logout: " + req.error);
            var userdata = {};

            if (req.user) {
                switch(req.user.provider) {
                    case 'google':
                        userdata.email = req.user.emails[0].value;
                        userdata.provider = req.user.provider;
                        break;
                    case 'facebook':
                        userdata.name = req.user.displayName;
                        userdata.email = req.user.emails[0].value;
                        userdata.provider = req.user.provider;
                        break;
                    case 'twitter':
                        userdata.name = req.user.displayName;
                        userdata.provider = req.user.provider;
                        break;
                    case 'symma':
                        userdata.email = req.user.emails[0].value;
                        userdata.provider = req.user.provider;
                        break;
                }
                res.render("profile", {userdata : userdata});
            }
            else
                res.redirect('/');

	});

	app.get('/logout', UserController.isAuthenticated, function(req, res, next){
        if (req.error) console.log("Request error on logout: " + req.error);
        req.logout();
        res.redirect('/');
	});
}