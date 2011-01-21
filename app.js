var express = require("express")
  , app = express.createServer()
  , mongodb = require("mongodb")
  , hostname = "127.0.0.1"
  , port = 3030
  , eventsCollection
  , daysCollection
  , events = require("./lib/events")

events.init(function (eCollection, dCollection) {
  eventsCollection = eCollection;
  daysCollection = dCollection;
  app.listen(port)
});

app.use(express.staticProvider(__dirname + '/public'))
app.use(express.bodyDecoder())
app.use(express.cookieDecoder())

app.set('view options', {
 layout: false
})

app.get("/", function (req, res) {
  res.send('Welcome to Wrack')
})

app.get("/api.js", function (req, res) {
  res.render("api/index.ejs", { locals: { host: hostname
                                        , port: port
                                        }
                              })
})

// incoming api endpoint
app.get("/track", function (req, res) {
  var doc = JSON.parse(decodeURIComponent(req.query.data))

  if(!doc.name) {
    res.send(JSON.stringify({"error": "name is required on events"}))
    return;
  }

  events.add(doc, { "ip": req.connection.remoteAddress
                  , "referer": req.headers.referer
                  , "user-agent": req.headers["user-agent"]
                  })

  res.send("\"ok\"")
})

app.get("/events", function (req, res) {
  console.log("GET /events");
  res.render("events/index.haml", { locals: { name: "all" }})
})

app.get("/events/:name", function (req, res) {
  var query = (req.params.name == "all") ? {} : { event: req.params.name }

  res.render("events/index.haml", { locals: { name: req.params.name }})
})

// get's the count data structure for an event :name
app.get("/api/events/:name/count", function (req, res) {
  console.log("GET /api/events/:name/count")
  var query = (req.params.name == "all") ? {} : { event: req.params.name }
  events.count(query, function (err, results) {
    res.send(JSON.stringify(results))
  });
})

// gets a list of all the event names in the db
app.get("/api/events/", function (req, res) {
  events.getNames(function (err, names) {
    res.send(JSON.stringify(names))
  });
})

// get's the full list of event data for an event :name
app.get("/api/events/:name", function (req, res) {
  var query = {}
  if (req.query.q) {
    try {
      query = JSON.parse(req.query.q)
    } catch (e) {}
  }

  var end = new Date()
  var start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000))

  query["_meta.date"] = {"$gte": start, "$lte": end}

  events.get({}, function (err, results) {
    res.send(JSON.stringify(results))
  })
})

// Retention is where we go to look at things like cohorts
app.get("/retention", function (req, res) {
})

app.get("/retention/:event", function (req, res) {
})

