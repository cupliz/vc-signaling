exports.up = function (knex, Promise) {
  return knex.schema.hasTable('calls').then(function (exists) {
    if (!exists) {
      return knex.schema
        .createTable('calls', function (table) {
          table.increments()
          table.string('status').defaultTo('open')
          table.string('guest')
          table.string('agent')
          table.string('company')
          table.string('guestSocket')
          table.string('agentSocket')
          table.float('lat')
          table.float('lng')
          table.integer('rate')
          table.integer('endedBy')
        })
        .createTable('session', function (table) {
          table.increments()
          table.string('agent')
          table.string('token')
        })
    }
  })
}

exports.down = function (knex, Promise) {
  return knex.schema
    .dropTableIfExists('calls')
    .dropTableIfExists("session");
}