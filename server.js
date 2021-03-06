const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
const db = require("./models");

const PORT = process.env.PORT || 3000;

// Initialize Express
const app = express();

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoscraper";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Routes

app.get("/scrape", function(req, res) {
  axios.get("http://www.echojs.com/").then(function(response) {
    const $ = cheerio.load(response.data);

    $("article h2").each(function(i, element) {
      let result = {};

      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      db.Article.create(result).then(function(dbArticle) {
          console.log(dbArticle);
        }).catch(function(err) {
          console.log(err);
        });
    });
    res.send("Scrape Complete");
  });
});

app.get("/articles", function(req, res) {
  db.Article.find({}).then(function(dbArticle) {
      res.json(dbArticle);
    }).catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id }).populate("note").then(function(dbArticle) {
      res.json(dbArticle);
    }).catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body).then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    }).then(function(dbArticle) {
      res.json(dbArticle);
    }).catch(function(err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
