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
var Configuration, fileSystem;

fileSystem = require('fs');

module.exports = Configuration = (function () {

    function Configuration() {
    }

    Configuration.settings = null;

    Configuration.getSettings = function (callback) {
        var _this = this;
        if (this.settings) {
            return process.nextTick(function () {
                return callback(null, _this.settings);
            });
        }
        return fileSystem.readFile("" + __dirname + "/config.json", 'utf8', function (error, data) {
            if (error) {
                callback(error);
            }

            this.settings = JSON.parse(data);

            return callback(null, this.settings);
        });
    };

    Configuration.developmentSettings = function (callback) {
        return this.getSettings(function (error, settings) {
            if (error) {
                return callback(error);
            }
            return callback(null, settings.development);
        });
    };

    Configuration.stagingSettings = function (callback) {
        return this.getSettings(function (error, settings) {
            if (error) {
                return callback(error);
            }
            return callback(null, settings.staging);
        });
    };
    Configuration.productionSettings = function (callback) {
        return this.getSettings(function (error, settings) {
            if (error) {
                return callback(error);
            }
            return callback(null, settings.production);
        });
    };

    return Configuration;

})();
