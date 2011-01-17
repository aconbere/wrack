var assert = require("assert")
require("../lib/date_math")


var d = new Date()
  , d2 = new Date(1979, 5, 6)

console.log(d)

assert.equal(d.sub().days(10).add().days(10).getTime(), d.getTime())
assert.equal(d.sub().weeks(10).add().weeks(10).getTime(), d.getTime())
assert.equal(d.sub().months(10).add().months(10).getTime(), d.getTime())
console.log(d.sub().months(10))
assert.equal(d.sub().years(10).add().years(10).getTime(), d.getTime())

assert.equal(d.days().since(), 0)
assert.equal(d2.days().since(), 11547)
assert.equal(d2.weeks().since(), 1649)
assert.equal(d2.months().since(), 379)
assert.equal(d2.years().since(), 32)

