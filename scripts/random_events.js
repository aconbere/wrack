#! /usr/bin/env node
var events = require("../lib/events")
  , userAgent = "Mozilla/5.0 (X11; U; Linux x86_64; en-US) AppleWebKit/534.13 (KHTML, like Gecko) Chrome/9.0.597.19 Safari/534.13"
  , ip = "10.10.10.10"
  , referer = "http://www.google.com"

var randomDate = function () {
  var d = (new Date()).getTime()
  var diff = 30 * 24 * 60 * 60 * 1000

  return function () {
    return new Date(d - Math.floor((Math.random() * diff)))
  };
}()

var randomName = function () {
  var names = [ "test"
              , "test2"
              , "test3"
              , "test4"
              ]
  return function () {
    return random(names);
  }
}()

var random = function (arr) {
  return arr[Math.floor((Math.random() * arr.length))]
}

events.init(function (eventsCollection) {
  for (var i = 0; i < 100000; i++) {
    var d = randomDate()

    events.add( { name: randomName() }
              , { "ip": ip
                , "referer": referer
                , "user-agent": userAgent
                }
              , d)
  }
  process.exit()
})
