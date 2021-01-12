const Knex = require("knex");

/**
 * 
 * @param {Knex} knex 
 */
exports.up = function(knex) {
  return knex.schema.createTable("admin_updates", table => {
    table.string("admin_id").notNullable();
    table.string("fields");
    table.string("action");
    table.dateTime("update_time");
  });
};

/**
 * 
 * @param {Knex} knex 
 */
exports.down = function(knex) {
  return knex.schema.dropTable("admin_updates");
};
