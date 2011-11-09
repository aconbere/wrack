// Event
{ name: "<name>"
, properties: {}
, date: Date
, day: "%Y-%M-%d"
, ip: "<ip>"
, referer: "<referrer>"
, user-agent: "<user-agent>"
}

// EventCount
{ event: "<name>"
, counts { "%Y-%M-%d": Int }
}

// Users
{ id: "<id>"
  cohorts: ["<cohort_ids>"]
}

// Cohorts
{ type: ["day", "week", "month"]
, ids: ["<id>"]
, count: Int
, start_date: Date
}
