var express = require("express")
  , app = express.createServer()
  , mongodb = require("mongodb")

var events_collection;
var hostname = "127.0.0.1"
var port = 3030

app.use(express.staticProvider(__dirname + '/public'));

var client = new mongodb.Db('wrack', new mongodb.Server("127.0.0.1", 27017, {}));
client.open(function (err) {
  if (err) throw err
  client.createCollection('events', function (err, collection) {
    if (err) throw err
    events_collection = collection;
    app.listen(port);
  })
})

app.use(express.bodyDecoder());
app.use(express.cookieDecoder());

app.set('view options', {
 layout: false
});

app.get("/", function (req, res) {
  res.send('Welcome to Wrack');
});

app.get("/api.js", function (req, res) {
  res.render("api/index.ejs", { locals: { host: hostname
                                        , port: port
                                        }
                              });
});

app.get("/track", function (req, res) {
  var doc = JSON.parse(decodeURIComponent(req.query.data));

  if(!doc.name) {
    res.send(JSON.stringify({"error": "name is required on events"}));
    return;
  }

  var meta = { "ip": req.connection.remoteAddress
             , "referer": req.headers.referer
             , "user-agent": req.headers["user-agent"]
             , "date": new Date()
             };

  events_collection.insert(merge(doc, {"_meta": meta}));
  res.send("\"ok\"");
});

var getEvents = function (query, callback) {
  events_collection.find(query, function (err, cursor) {
    cursor.toArray(function(err, results) {
      var events = results.map(function (r) {
        var date = r._meta.date;
        r._meta.date = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
        return r;
      })
      callback(err, events);
    });
  });
};

var renderEventsPage = function (name, events, res) {
  res.render("events/index.haml", { locals: { events: events
                                            , name: name
                                            }
                                  });
};

app.get("/events", function (req, res) {
  //var query = JSON.parse(req.query.q);
  var query = {};
  getEvents(query, function (err, events) {
    var name = query.name || "all"
    renderEventsPage(name, events, res);
  });
});

app.get("/events/:name", function (req, res) {
  var query = merge({ name: params.name }, JSON.parse(req.query.q));
  getEvents(query, function (err, events) {
    renderEventsPage(query.name, events, res);
  });
});

// gets a list of all the event names in the db
app.get("/api/events/names", function (req, res) {
  events_collection.distinct('name', function (err, results) {
    res.send(JSON.stringify(results));
  });
});

// q=<query>
app.get("/api/events", function (req, res) {
  console.log("GET /api/events");
  // { <event.name> : { <date>: <count> } } 
  var end = new Date();
  var start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));
  var command = { mapreduce: "events"
                , query: {"_meta.date": {"$gte": start, "$lte": end}}
                , map: (function () {
                    var date =  this._meta.date;
                    var d = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
                    var val = {};
                    val[d] = 1;
                    emit(this.name, val);
                  }).toString()
                , reduce: (function (key, values) {
                    // [ ["2010-05-01", 1 ], ... ]
                    var datesCount = {};
                    for (var i = 0; i < values.length; i++) {
                      var value = values[i];
                      var keys = [];
                      for (var k in value) {
                        keys.push(k);
                      }
                      for (var j = 0; j < keys.length; j++) {
                        var key = keys[j];
                        if (datesCount[key]) {
                          datesCount[key] += value[key];
                        } else {
                          datesCount[key] = value[key];
                        }
                      }
                    }
                    return datesCount;
                  }).toString()
                };

  client.executeDbCommand(command, function (err, results) {
    console.log(results);
    var tempCollection = results.documents[0].result;
    client.createCollection(tempCollection, function (err, collection) {
      collection.find(function (err, cursor) {
        cursor.toArray(function (err, results) {
          res.send(JSON.stringify(results))
        });
      });
    });
  });
});

app.get("/api/events/all", function (req, res) {
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
