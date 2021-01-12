const config = require("./knexfile");
const database = require("knex")(config.development);

module.exports = database;