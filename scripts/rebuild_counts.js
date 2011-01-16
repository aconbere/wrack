var mongodb = require("mongodb")
  , client = new mongodb.Db('wrack', new mongodb.Server("127.0.0.1", 27017, {}))
  , events = require("./lib/events")

events.init(function (_d, daysCollection) {
  events.resetDays(function () {})
  events.rebuildCounts(function (results) {
    results.forEach(function (r) {
      daysCollection.insert({ event: r._id
                            , counts: r.value
                            })
    })
    process.exit()
  })
})

