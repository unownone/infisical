import { TDbClient } from "@app/db";
import { TSecretApprovalPolicies, TableName } from "@app/db/schemas";
import { DatabaseError } from "@app/lib/errors";
import {
  TFindFilter,
  buildFindFilter,
  mergeOneToManyRelation,
  ormify,
  selectAllTableCols
} from "@app/lib/knex";
import { Knex } from "knex";

export type TSecretApprovalPolicyDalFactory = ReturnType<typeof secretApprovalPolicyDalFactory>;

export const secretApprovalPolicyDalFactory = (db: TDbClient) => {
  const secretApprovalPolicyOrm = ormify(db, TableName.SecretApprovalPolicy);

  const sapFindQuery = (tx: Knex, filter: TFindFilter<TSecretApprovalPolicies>) =>
    tx(TableName.SecretApprovalPolicy)
      .where(buildFindFilter(filter))
      .join(
        TableName.Environment,
        `${TableName.SecretApprovalPolicy}.envId`,
        `${TableName.Environment}.id`
      )
      .join(
        TableName.SapApprover,
        `${TableName.SecretApprovalPolicy}.id`,
        `${TableName.SapApprover}.policyId`
      )
      .select(tx.ref("approverId").withSchema(TableName.SapApprover))
      .select(tx.ref("name").withSchema(TableName.Environment).as("envName"))
      .select(tx.ref("slug").withSchema(TableName.Environment).as("envSlug"))
      .select(tx.ref("id").withSchema(TableName.Environment).as("envId"))
      .select(tx.ref("projectId").withSchema(TableName.Environment))
      .select(selectAllTableCols(TableName.SecretApprovalPolicy))
      .orderBy("createdAt", "asc");

  const findById = async (id: string, tx?: Knex) => {
    try {
      const doc = await sapFindQuery(tx || db, {
        [`${TableName.SecretApprovalPolicy}.id` as "id"]: id
      });
      const formatedDoc = mergeOneToManyRelation(
        doc,
        "id",
        ({ approverId, envId, envName: name, envSlug: slug, ...el }) => ({
          ...el,
          envId,
          environment: { id: envId, name, slug }
        }),
        ({ approverId }) => approverId,
        "approvers"
      );
      return formatedDoc?.[0];
    } catch (error) {
      throw new DatabaseError({ error, name: "FindById" });
    }
  };

  const find = async (
    filter: TFindFilter<TSecretApprovalPolicies & { projectId: string }>,
    tx?: Knex
  ) => {
    try {
      const docs = await sapFindQuery(tx || db, filter);
      const formatedDoc = mergeOneToManyRelation(
        docs,
        "id",
        ({ approverId, envId, envName: name, envSlug: slug, ...el }) => ({
          ...el,
          envId,
          environment: { id: envId, name, slug }
        }),
        ({ approverId }) => approverId,
        "approvers"
      );
      return formatedDoc;
    } catch (error) {
      throw new DatabaseError({ error, name: "Find" });
    }
  };

  return { ...secretApprovalPolicyOrm, findById, find };
};
