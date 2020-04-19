/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});
var bodyParser = require("body-parser");
var ObjectId = require("mongodb").ObjectID;

module.exports = function(app) {
  app
    .route("/api/books/")
    .get(function(req, res) {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        //console.log("we are login")
        if (err) console.log(err);
        var dbo = db
          .db("libraryDB")
          .collection("books")
          .find()
          .toArray()
          .then(function(books) {
            //console.log("getting books..")
            //console.log(books)
            //counter function
            function counter(arr) {
              arr.forEach(obj => {
                var count = obj.comments.length;
                obj["commentcount"] = count;
                delete obj["comments"];
              });
              return arr;
            }
            var update = counter(books);
            //console.log(update)
            res.status(200).json(update);
          });
      });
    })

    .post(function(req, res) {
      var title = req.body.title;
      var newBook = {
        title: title,
        comments: []
      };
      if (title == "") {
        res.type("text").send("missing book title");
      } else {
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
          //console.log("we are login")
          if (err) throw err;
          var dbo = db.db("libraryDB");
          dbo.collection("books").insertOne(newBook, function(err, docs) {
            //console.log("inserting..")
            if (err) res.json(err);
            //console.log(docs.ops);
            res.json(docs.ops[0]);
            db.close();
          });
        });
        //response will contain new book object including atleast _id and title
      }
    })

    .delete(function(req, res) {
      //if successful response will be 'complete delete successful'
     MongoClient.connect(MONGODB_CONNECTION_STRING,function(err,db){
       if(err) console.log(err)
       var dbo = db.db("libraryDB");
       dbo.collection('books').remove();
       res.type("text").send("complete delete successful")
     })
    });

  app
    .route("/api/books/:id")
    .get(function(req, res) {
      var bookid = {
        _id: ObjectId(req.params.id)
      };
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        //console.log("we are login")
        if (err) console.log(err);
        var dbo = db
          .db("libraryDB")
          .collection("books")
          .find(bookid)
          .toArray()
          .then(function(book) {
            //console.log("getting book..")
            if (book[0] == undefined) {
              res.type("text").send("no book exists");
            } else {
              res.status(200).json(book[0]);
            }
          });
      });
    })

    .post(function(req, res) {
      var comment = req.body.comment;
      //json res format same as .get
      var bookid = {
        _id: ObjectId(req.params.id)
      };

      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        if (err) console.log(err);
        var dbo = db.db("libraryDB");
        dbo
          .collection("books")
          .findOneAndUpdate(bookid, { $push: { comments: comment } }, function(
            err,
            docs
          ) {
            if (err) console.log(err);
            //console.log(docs.value)
            if (docs.value == undefined) {
              res.type("text").send("invalid ID");
            } else {
              docs.value.comments.push(comment)
              res.json(docs.value)
            }
            db.close();
          });
      });
    })

    .delete(function(req, res) {
      var bookid = req.params.id;
      //console.log(bookid)
      //if successful response will be 'delete successful'
      MongoClient.connect(MONGODB_CONNECTION_STRING,function(err,db){
        var dbo = db.db("libraryDB");
        var myquery = {_id: ObjectId(bookid)}
        console.log(myquery)
        dbo.collection("books").deleteOne(myquery,function(err,result){
         if (err) {
            res.type("text").send('_id error');
          db.close();
          };

         if (result.deletedCount === 0) {
              res.type("text").send('could not delete '+ bookid);
            } else {
              res.type("text").send("delete successful");
            }   
          
          db.close();
        })
      })
    
})
}
