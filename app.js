var express = require("express")
  , app = express.createServer()
  , mongodb = require("mongodb")

var eventsCollection
  , daysCollection
  , hostname = "127.0.0.1"
  , port = 3030


app.use(express.staticProvider(__dirname + '/public'))


var client = new mongodb.Db('wrack', new mongodb.Server("127.0.0.1", 27017, {}))

client.open(function (err) {
  if (err) throw err
  client.createCollection('events', function (err, eCollection) {
    if (err) throw err
    eventsCollection = eCollection

    client.createCollection('days', function (err, dCollection) {
      if (err) throw err
      daysCollection = dCollection
      app.listen(port)
    })
  })
})

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

  var date = new Date()
  var day = [date.getFullYear(), date.getMonth(), date.getDate()].join("-")

  var meta = { "ip": req.connection.remoteAddress
             , "referer": req.headers.referer
             , "user-agent": req.headers["user-agent"]
             , "date": date
             , "day": [date.getFullYear(), date.getMonth(), date.getDate()].join("-")
             }

  eventsCollection.insert(merge(doc, {"_meta": meta}))

  daysQ = { "event": doc.name
          , "day": day
          }
  daysDoc = merge(daysQ, { "$inc": { "count": 1 }})

  daysCollection.update( { event: doc.name , day: day, date: date }
                       , { "$inc": { count: 1 }}
                       , { upsert: true }
                       , function () {})

  res.send("\"ok\"")
})

var getEvents = function (query, callback) {
  eventsCollection.find(query, function (err, cursor) {
    cursor.toArray(function(err, results) {
      var events = results.map(function (r) {
        r._meta.date = r._meta.date.getTime()
        return r;
      })
      callback(err, events)
    })
  })
}

var renderEventsPage = function (name, events, res) {
  res.render("events/index.haml", { locals: { events: events
                                            , name: name
                                            }
                                  })
}

app.get("/api/events/count", function (req, res) {
  daysCollection.find({}, function (err, cursor) {
    cursor.toArray(function(err, results) {
      res.send(JSON.stringify(results))
    })
  })
})

app.get("/events", function (req, res) {
  //var query = JSON.parse(req.query.q)
  var end = new Date()
  var start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000))
  var query = {"_meta.date": {"$gte": start, "$lte": end}}

  getEvents(query, function (err, events) {
    var name = query.name || "all"
    renderEventsPage(name, events, res)
  })
})

// gets a list of all the event names in the db
app.get("/api/events/names", function (req, res) {
  eventsCollection.distinct('name', function (err, results) {
    res.send(JSON.stringify(results))
  })
})

// q=<query>
app.get("/api/events", function (req, res) {
  console.log("GET /api/events")
  // { <event.name> : { <date>: <count> } } 
  var end = new Date()
  var start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000))
  var command = { mapreduce: "events"
                , query: {"_meta.date": {"$gte": start, "$lte": end}}
                , map: (function () {
                    var val = {}
                    val[this._meta.day] = 1
                    emit(this.name, val)
                  }).toString()
                , reduce: (function (key, values) {
                    // [ ["2010-05-01", 1 ], ... ]
                    var datesCount = {}
                    for (var i = 0; i < values.length; i++) {
                      var value = values[i]
                      var keys = []
                      for (var k in value) {
                        keys.push(k)
                      }
                      for (var j = 0; j < keys.length; j++) {
                        var key = keys[j]
                        if (datesCount[key]) {
                          datesCount[key] += value[key]
                        } else {
                          datesCount[key] = value[key]
                        }
                      }
                    }
                    return datesCount;
                  }).toString()
                }

  client.executeDbCommand(command, function (err, results) {
    var tempCollection = results.documents[0].result
    console.log(results.documents)
    client.createCollection(tempCollection, function (err, collection) {
      collection.find(function (err, cursor) {
        cursor.toArray(function (err, results) {
          res.send(JSON.stringify(results))
        })
      })
    })
  })
})

app.get("/api/events/all", function (req, res) {
  eventsCollection.find(JSON.parse(req.query.q), function (err, cursor) {
    cursor.toArray(function(err, results) {
      res.send(JSON.stringify(results))
    })
  })
})

var merge = function (target, source) {
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      target[k] = source[k]
    }
  }
  return target
}
