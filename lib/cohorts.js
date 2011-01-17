var mongodb = require("mongodb")
  , client = new mongodb.Db('wrack', new mongodb.Server("127.0.0.1", 27017, {}))


exports.init = function (cb) {
  client.open(function (err) {
    if (err) throw err
    client.createCollection('cohorts', function (err, cCollection) {
      if (err) throw err
      cohortsCollection = cCollection
      callback(cCollection);
    })
  })
}

{ "cohort": 1
, "ids": [1, 2, 3, 4, 5]
, "counts": { "1": 12321
            , "2": 4545
            , "3": 643
            }
}

{"seen": [1,2,3,4]
 "start_date": new Date();
}

var day = 24 * 60 * 60 * 1000
  , week = 7 * day

var weeksSince = function (start) {
  var timestamp = new Date().getTime()
  return Math.floor((start.getTime() - timestamp) / week)
}

exports.add = function (id) {
  cohortsCollection.find({ cohort: 1}, function (err, cursor) {
    cursor.toArray(function(err, results) {
      var cohort_1 = results[0]
      current_week = weeksSince(cohort_1.start_date)
      // do something to group people into chunks of 12 for cohorts

      cohortsCollection.find( { cohort: "1", seen: id}, function
      cohortsCollection.update( { cohort: "1" }
                              , { "$addToSet": { ids: id } 
                                , "$inc": "counts." + chunk
                                }
                              , { upsert: true }
                              , function (err, result) {})

    })
  })
}
