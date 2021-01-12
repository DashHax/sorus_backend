const Knex = require("knex");

/**
 * 
 * @param {Knex} knex 
 */
exports.up = function(knex) {
  return knex.schema.createTable("pui_lists", table => {
    table.string("id").unique().primary();
    table.string("fullname").notNullable();
    table.string("icno").unique().notNullable();
    table.string("contactno").unique().notNullable();
    table.integer("local", 1).defaultTo(1).notNullable();
    table.string("nationality");
    table.string("nodeid");
    table.string("login_id");
  });
};

/**
 * 
 * @param {Knex} knex 
 */
exports.down = function(knex) {
    return knex.schema.dropTable("pui_lists");
};
