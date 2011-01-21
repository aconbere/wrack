var mongodb = require("mongodb")
  , client = new mongodb.Db('wrack', new mongodb.Server("127.0.0.1", 27017, {}))
  , eventsCollection
  , eventCountsCollection

Date.prototype.toDateString = function () {
  return [this.getFullYear(), this.getMonth() + 1, this.getDate()].join("-")
}

var merge = function (target, source) {
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      target[k] = source[k]
    }
  }
  return target
}

var datestringRange = function () {
  var hours = 24 * 60 * 60 * 1000
  var end = (new Date()).getTime()

  dateStrings = []
  for (var i = 0; i < 30; i++) {
    dateStrings.push(new Date(end).toDateString())
    end = end - hours
  }
  return dateStrings
}

exports.init = function (cb) {
  client.open(function (err) {
    if (err) throw err
    client.createCollection('events', function (err, eCollection) {
      if (err) throw err
      eventsCollection = eCollection
      eCollection.ensureIndex([["date", 1], ["day", 1]], function () {})

      client.createCollection('event-counts', function (err, eCCollection) {
        if (err) throw err
        eventCountsCollection = eCCollection
        cb(eCollection, eCCollection)
      })
    })
  })
}

// date is optional and primarily used for creating fake events
exports.add = function (doc, meta) {
  doc = merge(doc, meta)
  doc.date = doc.date || new Date()
  doc.day = doc.date.toDateString()

  eventsCollection.insert(doc)

  var incrementer = {}; incrementer["counts." + doc.day] = 1

  eventCountsCollection.update( { event: doc.name}
                              , { "$inc": incrementer }
                              , { upsert: true }
                              , function (err, result) {}
                              )
}

exports.get = function (q, callback) {
  var end = new Date()
  var start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000))

  var query = merge(q, {"date": {"$gte": start, "$lte": end}})

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

exports.count = function (query, callback) {
  query = query || {};

  relevantCounts = {}
  datestringRange().forEach(function (ds) {
    relevantCounts["counts." + ds] = 1
  })

  relevantCounts["event"] = 1
  daysCollection.find(query, relevantCounts, function (err, cursor) {
    cursor.toArray(callback)
  })
}

exports.getNames = function (callback) {
  eventsCollection.distinct('name', callback)
}

exports.rebuildCounts = function (callback) {
  // { <event.name> : { <date>: <count> } } 
  var end = new Date()
  var start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000))
  var command = { mapreduce: "events"
                , out: "q"
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
    client.createCollection(tempCollection, function (err, collection) {
      collection.find(function (err, cursor) {
        cursor.toArray(function (err, results) {
          if (callback) callback(results)
        })
      })
    })
  })
}

exports.resetDays = function (callback) {
  daysCollection.remove(function (err) {
    callback(err);
  });
}

exports.resetEvents = function (callback) {
  eventsCollection.remove(function (err) {
    callback(err)
  })
}

exports.reset = function (callback) {
  exports.resetEvents(function () {
    exports.resetDays(callback)
  })
}
