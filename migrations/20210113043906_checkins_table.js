const Knex = require("knex");

/**
 * 
 * @param {Knex} knex 
 */
exports.up = function(knex) {
  return knex.schema.createTable("checkins", table => {
      table.string("pui").notNullable();
      table.dateTime("checked_time").notNullable();
      table.string("lat");
      table.string("long");
      table.integer("inside", 1);
  })
};

/**
 * 
 * @param {Knex} knex 
 */
exports.down = function(knex) {
  return knex.schema.dropTable("checkins");
};
