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
var _ = require("underscore");

module.exports = {
    sendEmailHandler: function(mailer, emailto, properties, next, callback) {
        var email_template;
        email_template = 'email';

        var dat = {
            to: emailto, // REQUIRED. This can be a comma delimited string just like a normal email to field.
            subject: properties.subject // REQUIRED.
        };
        _.extend(dat, properties);
        if (properties && properties !== '' && emailto && emailto !== '') {
            mailer.send(email_template, dat, function (err) {
                if (err) {
                    // handle error
                    console.log(err);
                }
                if (callback) callback(err);
            });
        }
    },
    sendMassEmailHandler: function(mailer, emails_to, properties, next, callback) {
        var self = this;
        var email_template;
        var emailto;
        email_template = 'email';

        try {
            emailto = JSON.parse(emails_to);
        }
        catch (e) {
            return false;
        }

        if (emailto && emailto instanceof Array) {
            for (var i=0; i<emailto.length; ++i) {
                if (i === emailto.length-1) {
                    self.sendEmailHandler(mailer, emailto[i].email, properties, next, callback);
                }
                else {
                    self.sendEmailHandler(mailer, emailto[i].email, properties, next);
                }
            }
        }
    }
}
