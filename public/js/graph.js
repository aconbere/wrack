$(function () {
  // get the list of all the events and their counts on days
  $.getJSON("/api/events/count", {}, function (data) {
    var events = data.map(function (e) {
      var counts = [];
      Object.keys(e.counts).forEach(function (c) {
        counts.push([new Date(c).getTime(), e.counts[c]]);
      })
      e.counts = counts;
      return e;
    })

    var data = events.map(function (ev) {
      return { label: ev.event, data: ev.counts}
    })
    $.plot($("#plot"), data, { xaxis: { mode: "time", max: (new Date().getTime() + 1000 * 60 * 60 * 24)}
                             , series: { lines: { show: true }
                                       , points: { show: true }
                                       }
                             })
  })
})
