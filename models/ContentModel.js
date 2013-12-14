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
var crypto = require("crypto"),
    MongoClient = require('mongodb').MongoClient,
    BaseModel = require("./Base"),
	model = new BaseModel();

var ContentModel = model.extend({
    count: function(collection_name, querydata, callback) {
        this.db.collection(collection_name).count(querydata, callback || function(){ });
    },
	insert: function(collection_name, data, callback) {
		data.local_ID = crypto.randomBytes(20).toString('hex');
		this.db.collection(collection_name).insert(data, {safe: true}, callback || function(){ });
	},
	update: function(collection_name, data, callback) {
        this.db.collection(collection_name).update({local_ID: data.local_ID}, data, {safe: true}, callback || function(){ });
	},
	getlist: function(collection_name, querydata, callback) {
       this.db.collection(collection_name).find(querydata || {}).toArray(function(err, records) {
            callback(err, records);
        });
	},
	getOne: function(collection_name, querydata, callback) {
		this.db.collection(collection_name).findOne(querydata, callback);
	},
    removeOne: function(collection_name, querydata, callback) {
//        this.db.collection(collection_name).findOne(querydata, function(err, doc) {
//            console.log(doc._id);
//            this.db.collection(collection_name).remove({local_ID: doc.local_ID}, {fsync: true}, function(err, numberOfRemovedDocs) {
//                callback(err, numberOfRemovedDocs);
//            });
//        });
        this.db.collection(collection_name).findAndRemove(querydata, callback);
        //this.db.collection(collection_name).findAndModify({query: querydata, remove: true});
    },
    massremove: function(collection_name, querydata, callback) {
        this.db.collection(collection_name).remove(querydata, {fsync: true}, function(err, numberOfRemovedDocs) {
            callback(err, numberOfRemovedDocs);
        });
    }
});
module.exports = ContentModel;