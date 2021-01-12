const Knex = require("knex");

/**
 * 
 * @param {Knex} knex 
 */
exports.up = function(knex) {
  return knex.schema.createTable("locations", table => {
      table.string("id").unique().notNullable().primary();
      table.string("name");
      table.text("description");
      table.text("address");
      table.string("pui_id").notNullable();
      table.string("lat");
      table.string("long");
      table.float("radius");
  });
};

/**
 * 
 * @param {Knex} knex 
 */
exports.down = function(knex) {
  return knex.schema.dropTable("locations");
};
