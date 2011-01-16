var events = require("./lib/events")

events.init(function () {
  events.reset(function () {
    process.exit()
  })
})
