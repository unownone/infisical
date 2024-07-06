import { useTranslation } from "react-i18next";
import { subject } from "@casl/ability";
import {
  faCheckCircle,
  faCircle,
  faList,
  faMagnifyingGlass,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@radix-ui/react-dropdown-menu";

import NavHeader from "@app/components/navigation/NavHeader";
import { ProjectPermissionCan } from "@app/components/permissions";
import { Button, IconButton, Input, Tooltip } from "@app/components/v2";
import { UpgradeProjectAlert } from "@app/components/v2/UpgradeProjectAlert";
import { ProjectPermissionActions, ProjectPermissionSub, useWorkspace } from "@app/context";
import { usePopUp } from "@app/hooks";
import { useGetUserWsKey } from "@app/hooks/api";
import { DecryptedSecret } from "@app/hooks/api/types";
import { ProjectVersion } from "@app/hooks/api/workspace/types";

import { CreateConsumerSecretForm } from "../SecretOverviewPage/components/CreateConsumerSecretForm";
import { FolderBreadCrumbs } from "../SecretOverviewPage/components/FolderBreadCrumbs";
import { ConsumerSecretTypes } from "./types";

export const ConsumerSecretsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id as string;
  const { data: latestFileKey } = useGetUserWsKey(workspaceId);

  const { handlePopUpOpen, handlePopUpClose, handlePopUpToggle, popUp } = usePopUp([
    "addConsumerSecrets"
  ] as const);

  return (
    <div className="container mx-auto px-6 text-mineshaft-50 dark:[color-scheme:dark]">
      {/* <ProjectIndexSecretsSection decryptFileKey={latestFileKey!} /> */}
      <div className="relative right-5 ml-4">
        <NavHeader pageName={t("dashboard.consumer-secret-title")} isProjectRelated />
      </div>
      <div className="space-y-8">
        <div className="mt-6">
          <p className="text-3xl font-semibold text-bunker-100">Consumer Secrets</p>
          <p className="text-md text-bunker-300">
            Add your password logins, credit cards, and other info that you want to keep secure
          </p>
        </div>

        {currentWorkspace?.version === ProjectVersion.V1 && (
          <UpgradeProjectAlert project={currentWorkspace} />
        )}

        <div className="flex items-center justify-between">
          <FolderBreadCrumbs
            secretPath=""
            onResetSearch={() => console.log("This feature is not yet implemented.")}
          />
          <div className="flex items-center justify-between space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton
                  ariaLabel="Types"
                  variant="plain"
                  size="sm"
                  className="flex h-10 w-11 items-center justify-center overflow-hidden border border-mineshaft-600 bg-mineshaft-800 p-0 hover:border-primary/60 hover:bg-primary/10"
                >
                  <Tooltip content="Sort by Type" className="mb-2">
                    <FontAwesomeIcon icon={faList} />
                  </Tooltip>
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select type of Secret</DropdownMenuLabel>
                {Object.entries(ConsumerSecretTypes).map(([name, typeInfo]) => {
                  const isTypeSelected = typeInfo.selected;
                  return (
                    <DropdownMenuItem
                      onClick={() => {
                        /* do nothing */
                      }}
                      key={name}
                      icon={
                        isTypeSelected ? (
                          <FontAwesomeIcon className="text-primary" icon={faCheckCircle} />
                        ) : (
                          <FontAwesomeIcon className="text-mineshaft-400" icon={faCircle} />
                        )
                      }
                      iconPos="left"
                    >
                      <div className="flex items-center">{typeInfo.label}</div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-80">
              <Input
                className="h-[2.3rem] bg-mineshaft-800 placeholder-mineshaft-50 duration-200 focus:bg-mineshaft-700/80"
                placeholder="Search by secret/folder name..."
                // value={searchFilter}
                // onChange={(e) => setSearchFilter(e.target.value)}
                leftIcon={<FontAwesomeIcon icon={faMagnifyingGlass} />}
              />
            </div>
            <div>
              <ProjectPermissionCan
                I={ProjectPermissionActions.Create}
                a={subject(ProjectPermissionSub.Secrets, { secretPath: "" })}
              >
                {(isAllowed) => (
                  <Button
                    variant="outline_bg"
                    leftIcon={<FontAwesomeIcon icon={faPlus} />}
                    onClick={() => handlePopUpOpen("addConsumerSecrets")}
                    className="h-10 rounded-md"
                    isDisabled={!isAllowed}
                  >
                    Add Secret
                  </Button>
                )}
              </ProjectPermissionCan>
            </div>
          </div>
          <CreateConsumerSecretForm
            secretPath=""
            isOpen={popUp.addConsumerSecrets.isOpen}
            onTogglePopUp={(isOpen: any) => handlePopUpToggle("addConsumerSecrets", isOpen)}
            onClose={() => handlePopUpClose("addConsumerSecrets")}
            decryptFileKey={latestFileKey!}
            getSecretByKey={(slug: string, key: string): DecryptedSecret | undefined => {
              console.log(slug, key);
              throw new Error("Function not implemented.");
            }}
          />
        </div>
      </div>
    </div>
  );
};
