import { TProjectPermission } from "@app/lib/types";

export type TCreateSapDTO = {
  approvals: number;
  secretPath?: string | null;
  environment: string;
  approverUserIds: string[];
  projectId: string;
  name: string;
} & Omit<TProjectPermission, "projectId">;

export type TUpdateSapDTO = {
  secretPolicyId: string;
  approvals?: number;
  secretPath?: string | null;
  approverUserIds: string[];
  name?: string;
} & Omit<TProjectPermission, "projectId">;

export type TDeleteSapDTO = {
  secretPolicyId: string;
} & Omit<TProjectPermission, "projectId">;

export type TListSapDTO = TProjectPermission;

export type TGetBoardSapDTO = {
  projectId: string;
  environment: string;
  secretPath: string;
} & Omit<TProjectPermission, "projectId">;
