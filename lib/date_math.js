// Simple Date Math Library
//
// Example:
//
// d.sub().days(5)
// d.add().days(5)
var day = 24 * 60 * 60 * 1000
  , week = 7 * day

exports.weeksSince = function (start) {
  var timestamp = new Date().getTime()
  return Math.floor((start.getTime() - timestamp) / week)
}

var DateAddSub = function (date, apply) {
  this.apply = apply
  this.date = date
  this.timestamp = date.getTime()
}

DateAddSub.prototype.days = function (count) {
  return new Date(this.apply(this.timestamp, (count * day)))
}

DateAddSub.prototype.weeks = function (count) {
  return this.days(7 * count)
}

DateAddSub.prototype.months = function (count) {
  return new Date( this.date.getFullYear()
                 , this.apply(this.date.getMonth(), count)
                 , this.date.getDate()
                 , this.date.getHours()
                 , this.date.getMinutes()
                 , this.date.getSeconds()
                 , this.date.getMilliseconds()
                 )
}

DateAddSub.prototype.years = function (count) {
  return new Date( this.apply(this.date.getFullYear(), count) 
                 , this.date.getMonth()
                 , this.date.getDate()
                 , this.date.getHours()
                 , this.date.getMinutes()
                 , this.date.getSeconds()
                 , this.date.getMilliseconds()
                 )
  //var days = 0

  //var thisYear = this.date.getFullYear()

  //for (var i = 0; i < count; i++) {
  //  var year = this.apply(thisYear, i)
  //  days += ((year % 4 || year % 400) && !year % 100) ? 365 : 366
  //}

  //return this.days(days);
}

var DateSinceSpan = function (date, span) {
  this.span = span
  this.date = date
  this.timestamp = date.getTime()
}

DateSinceSpan.prototype.since = function () {
  return Math.floor((new Date().getTime() - this.timestamp) / this.span)
}

DateSince = function (date, type) {
  this.date = date
  this.type = type
}

DateSince.prototype.since = function () {
  var now = new Date()

  if (this.type == "year") {
    return now.getFullYear() - this.date.getFullYear()
  } else if (this.type == "month") {
    var monthDiff = now.getMonth() - this.date.getMonth()
    var yearDiff =  now.getFullYear() - this.date.getFullYear()
    return (yearDiff * 12) + monthDiff
  }
}


var inject = function (orig) {
  orig.prototype.sub = function () {
    return new DateAddSub(this, function (a,b) { return a - b })
  }

  orig.prototype.add = function () {
    return new DateAddSub(this, function (a,b) { return a + b })
  }

  orig.prototype.days = function () {
    return new DateSinceSpan(this, day)
  }

  orig.prototype.weeks = function () {
    return new DateSinceSpan(this, day * 7)
  }

  orig.prototype.months = function () {
    return new DateSince(this, "month")
  }

  orig.prototype.years = function () {
    return new DateSince(this, "year")
  }
}

inject(Date)
