$(function () {
  $.get("/api/events", {}, function (data) {
    // take the list of events and group them by name
    // for each of those group the events by time
    // that gives you a count of events per name per date
  });
});
