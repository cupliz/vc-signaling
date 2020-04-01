const crypto = require('crypto')
const KnexQueryBuilder = require('knex/lib/query/builder')
const dbConfig = require('../db/config.js')
const knex = require('knex')(dbConfig)

KnexQueryBuilder.prototype.paginate = async function (per_page, current_page) {
  const page = Math.max(current_page || 1, 1)
  const offset = (page - 1) * per_page
  const clone = this.clone()

  const [rows, total] = await Promise.all([
    this.offset(offset).limit(per_page),
    knex.count('*').from(clone.as('t1')),
  ])
  const count = parseInt(total.length > 0 ? total[0]['count(*)'] : 0)
  return {
    total: parseInt(count),
    per_page: per_page,
    offset: offset,
    current_page: page,
    last_page: Math.ceil(count / per_page),
    from: offset,
    to: offset + rows.length,
    data: rows,
  }
}

knex.queryBuilder = function () {
  return new KnexQueryBuilder(knex.client)
}

knex.sorting = (sort) => (queryBuilder) => {
  if (sort) {
    sort = sort.includes(',') ? sort.split(',') : [sort, 'asc']
    queryBuilder.orderBy(sort[0], sort[1])
  }
}

knex.md5 = (text) => {
  return crypto.createHash('md5').update(text).digest("hex")
}

module.exports = knex