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
  res.render("events/index.haml", { locals: { name: "all" }})
})

app.get("/api/events/count", function (req, res) {
  events.getCount(function (err, results) {
    res.send(JSON.stringify(results))
  });
})

// gets a list of all the event names in the db
app.get("/api/events/names", function (req, res) {
  events.getNames(function (names) {
    res.send(JSON.stringify(results))
  });
})

app.get("/api/events", function (req, res) {
  var query = {}
  if (req.query.q) {
    try {
      query = JSON.parse(req.query.q)
    } catch (e) {}
  }

  if (!req.query.all) {
    var end = new Date()
    var start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000))

    query["_meta.date"] = {"$gte": start, "$lte": end}
  }

  events.get({}, function (err, results) {
    res.send(JSON.stringify(results))
  })
})

