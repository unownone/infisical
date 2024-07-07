import { Knex } from "knex";

import { TableName } from "../schemas";
import { createOnUpdateTrigger, dropOnUpdateTrigger } from "../utils";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(TableName.ConsumerSecret))) {
    await knex.schema.createTable(TableName.ConsumerSecret, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.raw("gen_random_uuid()"));
      t.integer("version").defaultTo(1).notNullable();
      t.string("type").notNullable().defaultTo("shared");
      t.string("secret_type").notNullable().defaultTo("loginPassword");
      t.text("secretBlindIndex").nullable();
      t.text("secretKeyCiphertext").notNullable();
      t.text("secretKeyIV").notNullable();
      t.text("secretKeyTag").notNullable();
      t.text("secretValueCiphertext").notNullable();
      t.text("secretValueIV").notNullable();
      t.text("secretValueTag").notNullable();
      t.text("secretCommentCiphertext").nullable();
      t.text("secretCommentIV").nullable();
      t.text("secretCommentTag").nullable();
      t.string("secretReminderNote").nullable();
      t.integer("secretReminderRepeatDays").nullable();
      t.boolean("skipMultilineEncoding").defaultTo(false).nullable();
      t.string("algorithm").notNullable().defaultTo("aes-256-gcm");
      t.string("keyEncoding").notNullable().defaultTo("utf8");
      t.jsonb("metadata").nullable();
      t.uuid("userId").nullable().references("id").inTable("users");
      t.timestamps(true, true);
    });
  }

  await createOnUpdateTrigger(knex, TableName.ConsumerSecret);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TableName.ConsumerSecret);
  await dropOnUpdateTrigger(knex, TableName.ConsumerSecret);
}
