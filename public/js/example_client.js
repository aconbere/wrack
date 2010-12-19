var track = function (name, properties) {
  var event = { "name": name
              , "properties": properties
              };

  $.ajax({ url: "http://localhost:3030/events"
         , type: "POST"
         , contentType: "application/json; charset=utf-8"
         , data: JSON.stringify(event)
         , success: function (data) {
             console.log("sent event: " + JSON.stringify(event));
             console.log("recieved: " + data);
           }
         });
}

var events = function (name, filters, callback) {
  var data = merge({name: name}, filters || {})
  $.getJSON("http://localhost:3030/events", { query: JSON.stringify(data) }, function (events) {
    if(callback) callback(events);
  });
};

var merge = function (target, source) {
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      target[k] = source[k];
    }
  }
  return target;
};
