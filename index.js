var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var Search = require('google-search');
var gs = new Search({
    key: "AIzaSyC-Lb-RLYJECWFzQC1nZlA0mCwLl8xphUM",
    cx: "009748324334736257514:idtgqenkqb4"
})

var murl = process.env.MONGODB_URI || 'mongodb://localhost:27017/image_search';

app.set('view engine', 'pug');
app.set('port', (process.env.PORT || 5000));

// A 'get' for /api/latest/imagesearch that pulls out the latest searches from our db.
app.get('/api/latest/imagesearch', function(req, res) {
   // connect to db
   mongo.connect(murl, function(err, db) {
      if (err) {
          // Hey! Finally some halfway decent error handling. Just give an error reply.
          res.send({error: "Could not connect to the database."})
      } else {
          var collection = db.collection('searches');
          // search the database for the last 20 documents, turn em in to an array.
          // and then send them to the requester
          collection.find({}).limit(20).toArray(function(err, documents) {
              if (err) {
                  res.send({error: "Connected to database, could not retrieve documents."});
              } else {
                  res.send(JSON.stringify(documents))
              }
          });
          db.close();
      }
   });
});

app.get('/api/imagesearch/:term', function(req, res) {
    mongo.connect(murl, function(err,db) {
        if (err) {
            res.send({error: "Could not connect to the database, please try again later."})
        } else {
            var term = req.params.term;
            var offset = req.query.offset || 1;
            // connected to the database, save the search term that was used along with the timestamp.
            var collection = db.collection('searches');
            collection.insert({term: term, when: new Date().toISOString()});
            // I don't care about the results of saving documents to my own database.
            db.close();
            // perform the search on bing, and then send back the results to the user.
            // google api key: AIzaSyC-Lb-RLYJECWFzQC1nZlA0mCwLl8xphUM
            // google cx: 009748324334736257514:idtgqenkqb4
            gs.build({
              q: term,
              start: offset,
              num: 10, // Number of search results to return between 1 and 10, inclusive
            }, function(error, response) {
                // do something with the response object and just send back the pictures? maybe.
              res.send(JSON.stringify(response));
            });
            console.log("term " + term + " offset " + offset);
        }
    })
    
});

app.listen(app.get('port'), function() {
   console.log('listening for connections'); 
});