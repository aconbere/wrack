var express = require("express")
  , app = express.createServer()
  , mongodb = require("mongodb")

var events_collection;

var client = new mongodb.Db('wrack', new mongodb.Server("127.0.0.1", 27017, {}));
client.open(function (err) {
  if (err) throw err
  client.createCollection('events', function (err, collection) {
    if (err) throw err
    events_collection = collection;
    app.listen(3030);
  })
})

app.use(express.bodyDecoder());
app.use(express.cookieDecoder());
app.use(express.staticProvider(__dirname + '/public'));

app.set('view options', {
 layout: false
});

app.get("/", function (req, res) {
  res.send('Welcome to Wrack');
});

app.get("/api.js", function (req, res) {
  console.log(app.env);
  res.render("api/index.ejs", { locals: { host: "localhost" }});
});

app.get("/example", function (req, res) {
  res.render("example/index.haml");
});

app.post("/events", function (req, res) {
  var doc = req.body;

  if(!doc.name) {
    res.send(JSON.stringify({"error": "name is required on events"}));
    return;
  }

  var meta = { "ip": req.connection.remoteAddress
             , "referer": req.headers.referer
             , "user-agent": req.headers["user-agent"]
             , "date": (new Date()).toUTCString()
             };

  events_collection.insert(merge(doc, {"_meta": meta}));
  res.send("ok");
});

// q=<query>
app.get("/events", function (req, res) {
  events_collection.find(JSON.parse(req.query.q), function (err, cursor) {
    cursor.toArray(function(err, results) {
      res.send(JSON.stringify(results))
    });
  });
});

var merge = function (target, source) {
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      target[k] = source[k];
    }
  }
  return target;
};
