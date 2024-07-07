import { Knex } from "knex";

import { TDbClient } from "@app/db";
import { TableName } from "@app/db/schemas";
import { TConsumerSecrets, TConsumerSecretsUpdate } from "@app/db/schemas/consumer-secrets";
import { DatabaseError } from "@app/lib/errors";
import { ormify } from "@app/lib/knex";

export type TConsumerSecretDALFactory = ReturnType<typeof consumerSecretDALFactory>;

export const consumerSecretDALFactory = (db: TDbClient) => {
  const secretOrm = ormify(db, TableName.ConsumerSecret);
  const update = async (
    filter: Partial<TConsumerSecrets>,
    data: Omit<TConsumerSecretsUpdate, "version">,
    tx?: Knex
  ) => {
    try {
      const sec = await (tx || db)(TableName.ConsumerSecret)
        .where(filter)
        .update(data)
        .increment("version", 1)
        .returning("*");
      return sec;
    } catch (error) {
      throw new DatabaseError({ error, name: "update consumer secret" });
    }
  };

  return {
    ...secretOrm,
    update
  };
};
