import { z } from "zod";

import { SecretApprovalRequestsSchema, SecretsSchema, SecretTagsSchema, SecretType } from "@app/db/schemas";
import { EventType, UserAgentType } from "@app/ee/services/audit-log/audit-log-types";
import { removeTrailingSlash } from "@app/lib/fn";
import { secretsLimit } from "@app/server/config/rateLimiter";
import { getTelemetryDistinctId } from "@app/server/lib/telemetry";
import { getUserAgentType } from "@app/server/plugins/audit-log";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { ActorType, AuthMode } from "@app/services/auth/auth-type";
import { SecretOperations } from "@app/services/secret/secret-types";
import { PostHogEventTypes } from "@app/services/telemetry/telemetry-types";

export const registerConsumerSecretRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "GET",
    url: "/",
    config: {
      rateLimit: secretsLimit
    },
    schema: {
      querystring: z.object({
        workspaceId: z.string().trim()
      }),
      response: {
        200: z.object({
          secrets: SecretsSchema.omit({ secretBlindIndex: true })
            .extend({
              _id: z.string(),
              workspace: z.string(),
              secretPath: z.string().optional(),
              key: z.string(),
              tags: SecretTagsSchema.pick({
                id: true,
                slug: true,
                name: true,
                color: true
              }).array()
            })
            .array()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.API_KEY, AuthMode.SERVICE_TOKEN, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async () => {
      // const { consumerSecrets } = await server.services.secret.getConsumerSecrets({});
      // const { secrets, imports } = await server.services.secret.getSecrets({
      //   actorId: req.permission.id,
      //   actor: req.permission.type,
      //   actorAuthMethod: req.permission.authMethod,
      //   actorOrgId: req.permission.orgId,
      //   projectId: req.query.workspaceId,
      //   path: req.query.secretPath,
      //   includeImports: req.query.include_imports,
      //   recursive: req.query.recursive
      // });
      // await server.services.auditLog.createAuditLog({
      //   projectId: req.query.workspaceId,
      //   ...req.auditLogInfo,
      //   event: {
      //     type: EventType.GET_SECRETS,
      //     metadata: {
      //       environment: req.query.environment,
      //       secretPath: req.query.secretPath,
      //       numberOfSecrets: secrets.length
      //     }
      //   }
      // });
      // TODO: Move to telemetry plugin
      // let shouldRecordK8Event = false;
      // if (req.headers["user-agent"] === "k8-operatoer") {
      //   const randomNumber = Math.random();
      //   if (randomNumber > 0.95) {
      //     shouldRecordK8Event = true;
      //   }
      // }
      // const shouldCapture =
      //   req.query.workspaceId !== "650e71fbae3e6c8572f436d4" && req.headers["user-agent"] !== "k8-operator";
      // if (shouldCapture) {
      //   await server.services.telemetry.sendPostHogEvents({
      //     event: PostHogEventTypes.SecretPulled,
      //     distinctId: getTelemetryDistinctId(req),
      //     properties: {
      //       numberOfSecrets: secrets.length,
      //       workspaceId: req.query.workspaceId,
      //       environment: req.query.environment,
      //       secretPath: req.query.secretPath,
      //       channel: getUserAgentType(req.headers["user-agent"]),
      //       ...req.auditLogInfo
      //     }
      //   });
      // }
      // return { secrets, imports };
    }
  });

  server.route({
    method: "GET",
    url: "/:secretName",
    config: {
      rateLimit: secretsLimit
    },
    schema: {
      params: z.object({
        secretName: z.string().trim()
      }),
      querystring: z.object({
        workspaceId: z.string().trim(),
        environment: z.string().trim(),
        secretPath: z.string().trim().default("/").transform(removeTrailingSlash),
        type: z.nativeEnum(SecretType).default(SecretType.Shared),
        version: z.coerce.number().optional(),
        include_imports: z
          .enum(["true", "false"])
          .default("false")
          .transform((value) => value === "true")
      }),
      response: {
        200: z.object({
          secret: SecretsSchema.omit({ secretBlindIndex: true }).merge(
            z.object({
              workspace: z.string(),
              environment: z.string()
            })
          )
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.API_KEY, AuthMode.SERVICE_TOKEN, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const secret = await server.services.secret.getSecretByName({
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        environment: req.query.environment,
        projectId: req.query.workspaceId,
        path: req.query.secretPath,
        secretName: req.params.secretName,
        type: req.query.type,
        includeImports: req.query.include_imports,
        version: req.query.version
      });

      await server.services.auditLog.createAuditLog({
        projectId: req.query.workspaceId,
        ...req.auditLogInfo,
        event: {
          type: EventType.GET_SECRET,
          metadata: {
            environment: req.query.environment,
            secretPath: req.query.secretPath,
            secretId: secret.id,
            secretKey: req.params.secretName,
            secretVersion: secret.version
          }
        }
      });

      if (getUserAgentType(req.headers["user-agent"]) !== UserAgentType.K8_OPERATOR) {
        await server.services.telemetry.sendPostHogEvents({
          event: PostHogEventTypes.SecretPulled,
          distinctId: getTelemetryDistinctId(req),
          properties: {
            numberOfSecrets: 1,
            workspaceId: req.query.workspaceId,
            environment: req.query.environment,
            secretPath: req.query.secretPath,
            channel: getUserAgentType(req.headers["user-agent"]),
            ...req.auditLogInfo
          }
        });
      }
      return { secret };
    }
  });

  server.route({
    url: "/:secretName",
    method: "POST",
    config: {
      rateLimit: secretsLimit
    },
    schema: {
      body: z.object({
        workspaceId: z.string().trim(),
        environment: z.string().trim(),
        type: z.nativeEnum(SecretType).default(SecretType.Shared),
        secretPath: z.string().trim().default("/").transform(removeTrailingSlash),
        secretKeyCiphertext: z.string().trim(),
        secretKeyIV: z.string().trim(),
        secretKeyTag: z.string().trim(),
        secretValueCiphertext: z.string().trim(),
        secretValueIV: z.string().trim(),
        secretValueTag: z.string().trim(),
        secretCommentCiphertext: z.string().trim().optional(),
        secretCommentIV: z.string().trim().optional(),
        secretCommentTag: z.string().trim().optional(),
        metadata: z.record(z.string()).optional(),
        skipMultilineEncoding: z.boolean().optional()
      }),
      params: z.object({
        secretName: z.string().trim()
      }),
      response: {
        200: z.union([
          z.object({
            secret: SecretsSchema.omit({ secretBlindIndex: true }).merge(
              z.object({
                _id: z.string(),
                workspace: z.string(),
                environment: z.string()
              })
            )
          }),
          z.object({ approval: SecretApprovalRequestsSchema }).describe("When secret protection policy is enabled")
        ])
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.API_KEY, AuthMode.SERVICE_TOKEN, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const {
        workspaceId: projectId,
        secretPath,
        environment,
        metadata,
        type,
        secretKeyIV,
        secretKeyTag,
        secretValueIV,
        secretValueTag,
        secretCommentIV,
        secretCommentTag,
        secretKeyCiphertext,
        secretValueCiphertext,
        secretCommentCiphertext,
        skipMultilineEncoding
      } = req.body;
      if (req.body.type !== SecretType.Personal && req.permission.type === ActorType.USER) {
        const policy = await server.services.secretApprovalPolicy.getSecretApprovalPolicyOfFolder({
          actorId: req.permission.id,
          actorOrgId: req.permission.orgId,
          actorAuthMethod: req.permission.authMethod,
          actor: req.permission.type,
          secretPath,
          environment,
          projectId
        });
        if (policy) {
          const approval = await server.services.secretApprovalRequest.generateSecretApprovalRequest({
            actorId: req.permission.id,
            actor: req.permission.type,
            actorAuthMethod: req.permission.authMethod,
            actorOrgId: req.permission.orgId,
            secretPath,
            environment,
            projectId,
            policy,
            data: {
              [SecretOperations.Create]: [
                {
                  secretName: req.params.secretName,
                  secretValueCiphertext,
                  secretValueIV,
                  secretValueTag,
                  secretCommentIV,
                  secretCommentTag,
                  secretCommentCiphertext,
                  skipMultilineEncoding,
                  secretKeyTag,
                  secretKeyCiphertext,
                  secretKeyIV
                }
              ]
            }
          });

          await server.services.auditLog.createAuditLog({
            projectId: req.body.workspaceId,
            ...req.auditLogInfo,
            event: {
              type: EventType.SECRET_APPROVAL_REQUEST,
              metadata: {
                committedBy: approval.committerUserId,
                secretApprovalRequestId: approval.id,
                secretApprovalRequestSlug: approval.slug
              }
            }
          });

          return { approval };
        }
      }
      const secret = await server.services.secret.createSecret({
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        path: secretPath,
        type,
        environment: req.body.environment,
        secretName: req.params.secretName,
        projectId,
        secretKeyIV,
        secretKeyTag,
        secretKeyCiphertext,
        secretValueIV,
        secretValueTag,
        secretValueCiphertext,
        secretCommentIV,
        secretCommentTag,
        secretCommentCiphertext,
        skipMultilineEncoding,
        metadata
      });

      await server.services.auditLog.createAuditLog({
        projectId: req.body.workspaceId,
        ...req.auditLogInfo,
        event: {
          type: EventType.CREATE_SECRET,
          metadata: {
            environment: req.body.environment,
            secretPath: req.body.secretPath,
            secretId: secret.id,
            secretKey: req.params.secretName,
            secretVersion: secret.version
          }
        }
      });

      await server.services.telemetry.sendPostHogEvents({
        event: PostHogEventTypes.SecretCreated,
        distinctId: getTelemetryDistinctId(req),
        properties: {
          numberOfSecrets: 1,
          workspaceId: req.body.workspaceId,
          environment: req.body.environment,
          secretPath: req.body.secretPath,
          channel: getUserAgentType(req.headers["user-agent"]),
          ...req.auditLogInfo
        }
      });

      return { secret };
    }
  });

  server.route({
    method: "PATCH",
    url: "/:secretName",
    config: {
      rateLimit: secretsLimit
    },
    schema: {
      params: z.object({
        secretName: z.string()
      }),
      body: z.object({
        workspaceId: z.string().trim(),
        environment: z.string().trim(),
        secretId: z.string().trim().optional(),
        type: z.nativeEnum(SecretType).default(SecretType.Shared),
        secretPath: z.string().trim().default("/").transform(removeTrailingSlash),
        secretValueCiphertext: z.string().trim(),
        secretValueIV: z.string().trim(),
        secretValueTag: z.string().trim(),
        secretCommentCiphertext: z.string().trim().optional(),
        secretCommentIV: z.string().trim().optional(),
        secretCommentTag: z.string().trim().optional(),
        secretReminderRepeatDays: z.number().min(1).max(365).optional().nullable(),
        secretReminderNote: z.string().trim().nullable().optional(),
        tags: z.string().array().optional(),
        skipMultilineEncoding: z.boolean().optional(),
        // to update secret name
        secretName: z.string().trim().optional(),
        secretKeyIV: z.string().trim().optional(),
        secretKeyTag: z.string().trim().optional(),
        secretKeyCiphertext: z.string().trim().optional(),
        metadata: z.record(z.string()).optional()
      }),
      response: {
        200: z.union([
          z.object({
            secret: SecretsSchema.omit({ secretBlindIndex: true }).merge(
              z.object({
                _id: z.string(),
                workspace: z.string(),
                environment: z.string()
              })
            )
          }),
          z.object({ approval: SecretApprovalRequestsSchema }).describe("When secret protection policy is enabled")
        ])
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.API_KEY, AuthMode.SERVICE_TOKEN, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const {
        secretValueCiphertext,
        secretValueTag,
        secretValueIV,
        type,
        environment,
        secretPath,
        workspaceId: projectId,
        tags,
        secretCommentIV,
        secretCommentTag,
        secretCommentCiphertext,
        secretName: newSecretName,
        secretKeyIV,
        secretKeyTag,
        secretKeyCiphertext,
        skipMultilineEncoding,
        secretReminderRepeatDays,
        secretReminderNote,
        metadata
      } = req.body;

      if (req.body.type !== SecretType.Personal && req.permission.type === ActorType.USER) {
        const policy = await server.services.secretApprovalPolicy.getSecretApprovalPolicyOfFolder({
          actorId: req.permission.id,
          actor: req.permission.type,
          actorAuthMethod: req.permission.authMethod,
          actorOrgId: req.permission.orgId,
          secretPath,
          environment,
          projectId
        });
        if (policy) {
          const approval = await server.services.secretApprovalRequest.generateSecretApprovalRequest({
            actorId: req.permission.id,
            actor: req.permission.type,
            actorAuthMethod: req.permission.authMethod,
            actorOrgId: req.permission.orgId,
            secretPath,
            environment,
            projectId,
            policy,
            data: {
              [SecretOperations.Update]: [
                {
                  secretName: req.params.secretName,
                  newSecretName,
                  secretValueCiphertext,
                  secretValueIV,
                  secretValueTag,
                  secretCommentIV,
                  secretCommentTag,
                  secretCommentCiphertext,
                  skipMultilineEncoding,
                  secretKeyTag,
                  secretKeyCiphertext,
                  secretKeyIV,
                  tagIds: tags
                }
              ]
            }
          });

          await server.services.auditLog.createAuditLog({
            projectId: req.body.workspaceId,
            ...req.auditLogInfo,
            event: {
              type: EventType.SECRET_APPROVAL_REQUEST,
              metadata: {
                committedBy: approval.committerUserId,
                secretApprovalRequestId: approval.id,
                secretApprovalRequestSlug: approval.slug
              }
            }
          });
          return { approval };
        }
      }

      const secret = await server.services.secret.updateSecret({
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        path: secretPath,
        type,
        environment,
        secretName: req.params.secretName,
        projectId,
        secretKeyIV,
        secretKeyTag,
        secretKeyCiphertext,
        secretValueIV,
        tags,
        secretValueTag,
        secretValueCiphertext,
        secretCommentIV,
        secretCommentTag,
        secretCommentCiphertext,
        skipMultilineEncoding,
        metadata,
        secretReminderRepeatDays,
        secretReminderNote,
        newSecretName
      });

      await server.services.auditLog.createAuditLog({
        projectId: req.body.workspaceId,
        ...req.auditLogInfo,
        event: {
          type: EventType.UPDATE_SECRET,
          metadata: {
            environment: req.body.environment,
            secretPath: req.body.secretPath,
            secretId: secret.id,
            secretKey: req.params.secretName,
            secretVersion: secret.version
          }
        }
      });

      await server.services.telemetry.sendPostHogEvents({
        event: PostHogEventTypes.SecretUpdated,
        distinctId: getTelemetryDistinctId(req),
        properties: {
          numberOfSecrets: 1,
          workspaceId: req.body.workspaceId,
          environment: req.body.environment,
          secretPath: req.body.secretPath,
          channel: getUserAgentType(req.headers["user-agent"]),
          ...req.auditLogInfo
        }
      });
      return { secret };
    }
  });

  server.route({
    method: "DELETE",
    url: "/:secretName",
    config: {
      rateLimit: secretsLimit
    },
    schema: {
      params: z.object({
        secretName: z.string()
      }),
      body: z.object({
        type: z.nativeEnum(SecretType).default(SecretType.Shared),
        secretPath: z.string().trim().default("/").transform(removeTrailingSlash),
        secretId: z.string().trim().optional(),
        workspaceId: z.string().trim(),
        environment: z.string().trim()
      }),
      response: {
        200: z.union([
          z.object({
            secret: SecretsSchema.omit({ secretBlindIndex: true }).merge(
              z.object({
                _id: z.string(),
                workspace: z.string(),
                environment: z.string()
              })
            )
          }),
          z.object({ approval: SecretApprovalRequestsSchema }).describe("When secret protection policy is enabled")
        ])
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.API_KEY, AuthMode.SERVICE_TOKEN, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const { secretPath, type, workspaceId: projectId, secretId, environment } = req.body;
      if (req.body.type !== SecretType.Personal && req.permission.type === ActorType.USER) {
        const policy = await server.services.secretApprovalPolicy.getSecretApprovalPolicyOfFolder({
          actorId: req.permission.id,
          actor: req.permission.type,
          actorAuthMethod: req.permission.authMethod,
          actorOrgId: req.permission.orgId,
          secretPath,
          environment,
          projectId
        });
        if (policy) {
          const approval = await server.services.secretApprovalRequest.generateSecretApprovalRequest({
            actorId: req.permission.id,
            actor: req.permission.type,
            actorAuthMethod: req.permission.authMethod,
            actorOrgId: req.permission.orgId,
            secretPath,
            environment,
            projectId,
            policy,
            data: {
              [SecretOperations.Delete]: [
                {
                  secretName: req.params.secretName
                }
              ]
            }
          });

          await server.services.auditLog.createAuditLog({
            projectId: req.body.workspaceId,
            ...req.auditLogInfo,
            event: {
              type: EventType.SECRET_APPROVAL_REQUEST,
              metadata: {
                committedBy: approval.committerUserId,
                secretApprovalRequestId: approval.id,
                secretApprovalRequestSlug: approval.slug
              }
            }
          });
          return { approval };
        }
      }

      const secret = await server.services.secret.deleteSecret({
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        path: secretPath,
        type,
        environment,
        secretName: req.params.secretName,
        projectId,
        secretId
      });

      await server.services.auditLog.createAuditLog({
        projectId: req.body.workspaceId,
        ...req.auditLogInfo,
        event: {
          type: EventType.DELETE_SECRET,
          metadata: {
            environment: req.body.environment,
            secretPath: req.body.secretPath,
            secretId: secret.id,
            secretKey: req.params.secretName,
            secretVersion: secret.version
          }
        }
      });

      await server.services.telemetry.sendPostHogEvents({
        event: PostHogEventTypes.SecretDeleted,
        distinctId: getTelemetryDistinctId(req),
        properties: {
          numberOfSecrets: 1,
          workspaceId: req.body.workspaceId,
          environment: req.body.environment,
          secretPath: req.body.secretPath,
          channel: getUserAgentType(req.headers["user-agent"]),
          ...req.auditLogInfo
        }
      });
      return { secret };
    }
  });
};
