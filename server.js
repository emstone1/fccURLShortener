'use strict';
var express = require('express');
var mongoose = require('mongoose');
var validUrl = require('valid-url');
var shortid = require('shortid');
var app = express();
var dotenv = require('dotenv');
//prevents warnings from showing but no effect on program
mongoose.Promise = global.Promise

//connect to db
var db = mongoose.connection
db.on('error', console.error);
db.once('open', function() {
    console.log("DB Connected")
});
var mongoURI=process.env.MONGODB_URI
mongoose.connect(mongoURI);

//create a scheme for the urls
var urlSchema = new mongoose.Schema({
    url: String,
    shortId: {
        type: String,
        unique: true,
        default: shortid.generate
    },
    created: {
        type: Date,
        default: Date.now
    },
});
//create a model based on the url schema
var URL = mongoose.model('URL', urlSchema);

//if pulling the home page, serves static instructions
app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/index.html');
});

//if creating new record, handles appropriately
app.get('/new/*', function(req, res) {
    var baseurl = req.protocol + '://' + req.get('host') + '/'
    console.log(baseurl)
    var urlpath = req.path.slice(5)
    res.send(addtoDB(urlpath, baseurl))
})

//if visiting a short url, handles appropriately
app.get('/*', function(req, res) {
    var urlpath = req.path.slice(1)
    URL.find({
        shortId: urlpath
    }, function(err, docs) {
        if (err) throw err;
        res.redirect(docs[0].url);
    });
    
});

function addtoDB(urlpath, baseurl) {
    if (validUrl.isWebUri(urlpath)) {
        var newurl = new URL({
            url: urlpath
        });
        newurl.save(function(err, newurl) {
        if (err) throw err;
        });
        var json = {
            original_url: urlpath,
            new_url: baseurl + newurl.shortId
        }
    } else {
        var json = {
            error: "URL invalid"
        }
    }
    return JSON.stringify(json)
}


var port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('Node.js listening on port ' + port + '...');
});