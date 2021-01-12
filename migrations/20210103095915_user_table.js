const Knex = require("knex");

/**
 * 
 * @param {Knex} knex 
 */
exports.up = function(knex) {
  return knex.schema.createTable("users", (table) => {
      table.string("id").primary().unique();
      table.string("username").unique();
      table.string("password");
      table.string("fullname");
      table.string("phoneno");
      table.integer("type", 1).defaultTo(1);
      table.string("email");
  })
};

/**
 * 
 * @param {Knex} knex 
 */
exports.down = function(knex) {
  return knex.schema.dropTable("users");
};
