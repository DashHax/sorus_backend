const Knex = require("knex");

/**
 * 
 * @param {Knex} knex 
 */
exports.up = function(knex) {
  return knex.schema.createTable("regkeys", table => {
      table.string("key").notNullable();
  })
};

/**
 * 
 * @param {Knex} knex 
 */
exports.down = function(knex) {
  return knex.schema.dropTable("regkeys");
};
