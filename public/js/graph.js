$(function () {
  // get the list of all the events and their counts on days
  $.get("/api/events/count", {}, function (data) {
    console.log(data)
    $.plot($("#plot"), [[1,2],[3,4]])
  })
})
