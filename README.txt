# COHORTS #

## Description ##
  Cohort tracking is a technique for measuring _______ by following a group of users (a cohort) through a set time span, and observing the incidence of return visits.

  Every event carries with it two possible means of identifying the client. Either the clients IP address or an affixed unique id (API[track]). Using this identification Cohort tracking splits your user base into "N" many groups (Configuration[cohort_count]), one group per week (Configuration[cohort_span]). Every N weeks the first cohort is deleted and we start again.

  Tracking begins with the first inserted event. Because testing often precedes deployment, this can scew the first weeks data, it's useful to reset the cohort tracking on first deploying Wrack (API[cohort_reset]).

##Identification ##

  Cohorts are created by checking the ID assigned to an event. ID's are by default created from the incoming client IP address, but can also be set using API[register].

  startDate = x

  weeks_since

  cohort_1: [<id>]
  cohort_2: [<id>]
  ...
  cohort_n: [<id>]

  inclusion = function (id) {
    // for each cohort check if this id is a member
    // and if so, track another visit for it
    for (var i = 0; i < cohorts.length; i++) {
      if (cohorts[i].include(id)) {
        cohort[i].track(id);
        return false;
      }
    }

    // if the id isn't part of any of the cohorts
    // then add it to the current cohort group

    current_cohort().newMember(id)
  }

  var Cohort = function () {}

  Cohort.prototype.track = function (id) {
    current_cohort.number();
  }
