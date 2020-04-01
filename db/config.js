const path = require('path')
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, './mydb.sqlite3'),
  },
  migrations: {
    directory: path.join(__dirname, './migrations'),
  },
  seeds: {
    directory: path.join(__dirname, './seeds'),
  },
  useNullAsDefault: true
}