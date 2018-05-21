'use strict';

exports.up = function (knex) {
    return knex.schema
        .createTable('users', function (table) {

            table.bigincrements('id').primary();
            table.string('email').notNullable();
            table.string('first_name');
            table.string('last_name');
            table.string('profile_image');
            table.string('auth_issuer');
            table.string('locale');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('active_at').defaultTo(knex.fn.now());

            table.unique('email');
        });
};

exports.down = function (knex) {
    return knex.schema
    .dropTableIfExists('users')
    .dropTableIfExists('messages');
};
