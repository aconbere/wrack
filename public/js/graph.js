var init = function () {
  makePlot()
  $("#plot").bind("plothover", function (event, pos, item) {
    if (item) {
      if (previousPoint != item.datapoint) {
        previousPoint = item.datapoint
        
        $("#tooltip").remove();
        var x = item.datapoint[0].toFixed(2),
            y = item.datapoint[1].toFixed(2)
        
        showTooltip(item.pageX, item.pageY,
                    item.series.label + ": " + y)
      }
    } else {
      $("#tooltip").remove()
      previousPoint = null
    }
  })
}

var showTooltip = function (x, y, contents) {
  $('<div id="tooltip">' + contents + '</div>').css( {
    position: 'absolute',
    display: 'none',
    top: y + 5,
    left: x + 5,
    border: '1px solid #fdd',
    padding: '2px',
    'background-color': '#fee',
    opacity: 0.80
  }).appendTo("body").fadeIn(200)
}

var makePlot = function (data) {
  data = data || []
  var labelFormatter = function (label, series) {
    return '<a href="/events/' + label + '/">' + label + '</a>';
  }
  $.plot($("#plot"), data, { xaxis: { mode: "time",
                                      max: (new Date().getTime() + 1000 * 60 * 60 * 24)
                                    }
                           , series: { lines: { show: true }
                                     , points: { show: true }
                                     }
                           , grid: { hoverable: true }
                           , legend: { labelFormatter: labelFormatter }
                           })
}
 

$(function () {
  init()
  var eventName = $("body").attr("class")

  // get the list of all the events and their counts on days
  $.getJSON("/api/events/" + eventName + "/count", {}, function (data) {
    var events = data.map(function (e) {
      var counts = [];
      Object.keys(e.counts).forEach(function (c) {
        counts.push([new Date(c).getTime(), e.counts[c]])
      })
      e.counts = counts
      return e
    })

    var data = events.map(function (ev) {
      return { label: ev.event
             , data: ev.counts
             }
    })

    makePlot(data)
  })

  previousPoint = null

})
