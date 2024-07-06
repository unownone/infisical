import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { subject } from "@casl/ability";
import {
  faArrowDown,
  faArrowUp,
  faFolderBlank,
  faMagnifyingGlass,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import NavHeader from "@app/components/navigation/NavHeader";
import { ProjectPermissionCan } from "@app/components/permissions";
import {
  Button,
  EmptyState,
  IconButton,
  Input,
  Table,
  TableContainer,
  TableSkeleton,
  TBody,
  Td,
  TFoot,
  Th,
  THead,
  Tr
} from "@app/components/v2";
import { UpgradeProjectAlert } from "@app/components/v2/UpgradeProjectAlert";
import { ProjectPermissionActions, ProjectPermissionSub, useWorkspace } from "@app/context";
import { usePopUp } from "@app/hooks";
import { useGetUserWsKey } from "@app/hooks/api";
import { DecryptedSecret } from "@app/hooks/api/types";
import { ProjectVersion } from "@app/hooks/api/workspace/types";

import { FolderBreadCrumbs } from "../SecretOverviewPage/components/FolderBreadCrumbs";
import { CreateConsumerSecretFormModal } from "./components/CreateConsumerSecretForm/CreateConsumerSecret";

export const ConsumerSecretsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id as string;
  const { data: latestFileKey } = useGetUserWsKey(workspaceId);

  const parentTableRef = useRef<HTMLTableElement>(null);

  const { handlePopUpOpen, handlePopUpClose, handlePopUpToggle, popUp } = usePopUp([
    "addConsumerSecrets"
  ] as const);

  const isTableLoading = false;
  const canViewOverviewPage = true;
  const isSorted = true;
  const isTableEmpty = true;

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
            <div className="w-80">
              <Input
                className="h-[2.3rem] bg-mineshaft-800 placeholder-mineshaft-50 duration-200 focus:bg-mineshaft-700/80"
                placeholder="Search by secret/folder name..."
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
        </div>
        <div className="thin-scrollbar mt-4" ref={parentTableRef}>
          <TableContainer className="max-h-[calc(100vh-250px)] overflow-y-auto">
            <Table>
              <THead>
                <Tr className="sticky top-0 z-20 border-0">
                  <Th className="sticky left-0 z-20 min-w-[20rem] border-b-0 p-0">
                    <div className="flex items-center border-b border-r border-mineshaft-600 px-5 pt-3.5 pb-3">
                      Name
                      <IconButton
                        variant="plain"
                        className="ml-2"
                        ariaLabel="sort"
                        onClick={() => console.log("This feature is not yet implemented.")}
                      >
                        <FontAwesomeIcon icon={isSorted ? faArrowDown : faArrowUp} />
                      </IconButton>
                    </div>
                  </Th>
                </Tr>
              </THead>
              <TBody>
                {canViewOverviewPage && isTableLoading && (
                  <TableSkeleton
                    columns={2}
                    innerKey="secret-overview-loading"
                    rows={5}
                    className="bg-mineshaft-700"
                  />
                )}
                {isTableEmpty && !isTableLoading && (
                  <Tr>
                    <Td colSpan={2}>
                      <EmptyState title="Let's add some secrets" icon={faFolderBlank} iconSize="3x">
                        <Button
                          className="mt-4"
                          variant="outline_bg"
                          colorSchema="primary"
                          size="md"
                          onClick={() => handlePopUpOpen("addConsumerSecrets")}
                        >
                          Add Secrets
                        </Button>
                      </EmptyState>
                    </Td>
                  </Tr>
                )}
                {/* {!isTableLoading &&
                      <SecretOverviewFolderRow
                        folderName={folderName}
                        isFolderPresentInEnv={isFolderPresentInEnv}
                        isSelected={selectedEntries.folder[folderName]}
                        onToggleFolderSelect={() =>
                          toggleSelectedEntry(EntryType.FOLDER, folderName)
                        }
                        environments={visibleEnvs}
                        key={`overview-${folderName}-${index + 1}`}
                        onClick={handleFolderClick}
                        onToggleFolderEdit={(name: string) =>
                          handlePopUpOpen("updateFolder", { name })
                        }
                      />
                    ))}
                  {!isTableLoading &&
                    filteredDynamicSecrets.map((dynamicSecretName, index) => (
                      <SecretOverviewDynamicSecretRow
                        dynamicSecretName={dynamicSecretName}
                        isDynamicSecretInEnv={isDynamicSecretPresentInEnv}
                        environments={visibleEnvs}
                        key={`overview-${dynamicSecretName}-${index + 1}`}
                      />
                    ))}
                  {!isTableLoading &&
                    visibleEnvs?.length > 0 &&
                    filteredSecretNames.map((key, index) => (
                      <SecretOverviewTableRow
                        isSelected={selectedEntries.secret[key]}
                        onToggleSecretSelect={() => toggleSelectedEntry(EntryType.SECRET, key)}
                        secretPath={secretPath}
                        getImportedSecretByKey={getImportedSecretByKey}
                        isImportedSecretPresentInEnv={isImportedSecretPresentInEnv}
                        onSecretCreate={handleSecretCreate}
                        onSecretDelete={handleSecretDelete}
                        onSecretUpdate={handleSecretUpdate}
                        key={`overview-${key}-${index + 1}`}
                        environments={visibleEnvs}
                        secretKey={key}
                        getSecretByKey={getSecretByKey}
                        expandableColWidth={expandableTableWidth}
                      />
                    ))} */}
              </TBody>
              <TFoot>
                <Tr className="sticky bottom-0 z-10 border-0 bg-mineshaft-800">
                  <Td className="sticky left-0 z-10 border-0 bg-mineshaft-800 p-0">
                    <div
                      className="w-full border-t border-r border-mineshaft-600"
                      style={{ height: "45px" }}
                    />
                  </Td>
                </Tr>
              </TFoot>
            </Table>
          </TableContainer>
        </div>
      </div>
      <CreateConsumerSecretFormModal
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
  );
};
