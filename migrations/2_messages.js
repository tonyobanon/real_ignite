'use strict';

exports.up = function (knex) {
    return knex.schema
        .createTable('messages', function (table) {

            table.bigincrements('id').primary();
            table.string('user_id').notNullable();
            table.string('subject');
            table.text('body');
            table.text('body_preview');
            table.text('cc_addresses');
            table.text('bcc_addresses');
            table.string('provider_name');
            table.text('provider_response');
            table.text('errors');
            table.boolean('is_sent').defaultTo(false);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('messages');
};
