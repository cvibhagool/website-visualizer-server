var express = require('express');
var bodyParser = require('body-parser');
var child_process = require('child_process');
var path = require('path');
var fs = require('fs');
var app = express();
var output;
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Accept POST request with URL 
app.post('/crawl',function(req, res) {
  var targetUrl = req.body.url;
  var pythonCommand = 'python scraper.py ' + targetUrl;
  console.log(pythonCommand);
  var child = child_process.exec(pythonCommand, function(err){
    if (err){
      console.log("Crawl error:", err);
      return res.stausCode(400);
    }
    //Send the JSON
    fs.readFile('./output.json', function(err,data){
      console.log("Crawl successful");
      res.json(JSON.parse(data));
    });
  });
});

//Start the server
var port = process.env.PORT || 5000;
console.log("Sitemap is listening on port", port);
app.listen(port);