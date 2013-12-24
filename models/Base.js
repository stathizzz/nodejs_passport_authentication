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
var _ = require('underscore'),
    MongoClient = require('mongodb').MongoClient;

module.exports = function() {
    //this.db = db;
};
module.exports.prototype = {
//    extend: function(properties) {
//    var Child = module.exports;
//    Child.prototype = module.exports.prototype;
//    for(var key in properties) {
//        Child.prototype[key] = properties[key];
//    }
//    return Child;
//    },
    extend: function(child) {
        return _.extend({}, this, child);
    },
    initDB : function(settings, callback) {
        var conStr = "mongodb://" + settings.mongo.host + ":" + settings.mongo.port + "/" + settings.mongo.db_name;
        var self = this;
        MongoClient.connect(conStr, function(err, db) {
            self.db = db;
            self.db_name = settings.mongo.db_name;
            if (callback) callback(err, db);
        });
    },
    setDB: function(db) {
        this.db = db;
    },
    getDB: function() {
        return this.db;
    },
    getDBName: function () {
        return this.db_name;
    },
    collection: function(name) {
        if(this.db._collection) return this.db._collection;
        return this.db._collection = this.db.collection(name);
    }
};

