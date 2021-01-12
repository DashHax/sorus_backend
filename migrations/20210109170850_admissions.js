const Knex = require("knex");

/**
 * 
 * @param {Knex} knex 
 */
exports.up = function(knex) {
  return knex.schema.createTable("admissions", table => {
      table.string("id").primary().notNullable();
      table.string("pui").notNullable();
      table.string("admitted_by").notNullable();
      table.dateTime("admission_date");
      table.float("duration");
      table.string("unit");
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("admissions");
};
