#! /usr/bin/env node
var events = require("../lib/events")

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

