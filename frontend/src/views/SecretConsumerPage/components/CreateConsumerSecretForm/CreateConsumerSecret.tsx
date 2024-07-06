import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Button,
  FormControl,
  Input,
  Modal,
  ModalContent,
  Select,
  SelectItem
} from "@app/components/v2";
import { useWorkspace } from "@app/context";
// import { useCreateSecretV3, useUpdateSecretV3 } from "@app/hooks/api";
import { DecryptedSecret, UserWsKeyPair } from "@app/hooks/api/types";

import { ConsumerSecretType, VariableConsFormController } from "./FormTypes";

const typeSchema = z
  .object({
    key: z.string().trim().min(1, "Key is required"),
    value: z.string().optional(),
    sec_type: z.string()
  })
  .refine((data) => data.key !== undefined, {
    message: "Please enter secret name"
  });

type TFormSchema = z.infer<typeof typeSchema>;

const ConsumerSecretToggleMapping: Record<ConsumerSecretType, string> = {
  [ConsumerSecretType.LoginPassword]: "Login Password",
  [ConsumerSecretType.CreditCard]: "Credit Card",
  [ConsumerSecretType.SecureNote]: "Secure Note"
};

type Props = {
  secretPath?: string;
  decryptFileKey: UserWsKeyPair;
  getSecretByKey: (slug: string, key: string) => DecryptedSecret | undefined;
  // modal props
  isOpen?: boolean;
  onClose: () => void;
  onTogglePopUp: (isOpen: boolean) => void;
};

export const CreateConsumerSecretFormModal: React.FC<Props> = ({
  // secretPath = "/",
  isOpen,
  // getSecretByKey,
  onClose
}: Props) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    // watch,
    formState: { isSubmitting, errors }
  } = useForm<TFormSchema>({ resolver: zodResolver(typeSchema) });
  const [consumerSecretType, setConsumerSecretType] = React.useState<ConsumerSecretType>(
    ConsumerSecretType.LoginPassword
  );
  // const newSecretKey = watch("key");
  const { currentWorkspace } = useWorkspace();
  // const workspaceId = (currentWorkspace?.id as string) || "";

  // const { mutateAsync: createSecretV3 } = useCreateSecretV3();
  // const { mutateAsync: updateSecretV3 } = useUpdateSecretV3();

  const formOnSubmit = handleSubmit(async ({ key, value }: TFormSchema) => {
    try {
      console.log(key, value);
      // const secret = getSecretByKey(secretPath, newSecretKey);
      // if (secret) {
      //   await updateSecretV3({
      //     workspaceId,
      //     secretId: secret.id,
      //     data: {
      //       key,
      //       value
      //       //   environments: environments
      //     }
      //   });
      // } else {
      //   await createSecretV3({
      //     workspaceId,
      //     secretPath,
      //     data: {
      //       key,
      //       value
      //       //   environments: environments
      //     }
      //   });
      // }
      reset();
      onClose();
    } catch (e) {
      console.error(e);
    }
  });

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent
        className="max-h-[80vh] overflow-y-auto"
        title="Create a Consumer Secret"
        subTitle="Create Consumer Secrets like login passwords, credit cards, etc."
      >
        <form onSubmit={() => formOnSubmit()}>
          <div className="space-y-4">
            <div className="flex w-full flex-row justify-between">
              <FormControl
                label="key"
                isError={Boolean(errors?.key)}
                errorText={Boolean(errors?.key?.message)}
                className="w-grow"
              >
                <Input
                  {...register("key")}
                  placeholder="Type your secret name"
                  autoCapitalization={currentWorkspace?.autoCapitalization}
                />
              </FormControl>
              <FormControl
                label="Type"
                isError={Boolean(errors?.key)}
                errorText={Boolean(errors?.key?.message)}
                className="w-grow"
              >
                <Select
                  {...register("sec_type")}
                  placeholder="Select Type"
                  onValueChange={(val: ConsumerSecretType) => setConsumerSecretType(val)}
                  value={consumerSecretType}
                >
                  {Object.entries(ConsumerSecretToggleMapping).map(([key, label]) => (
                    <SelectItem value={key} key={key}>
                      {label}
                    </SelectItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <VariableConsFormController
              formType={consumerSecretType}
              control={control}
              register={register}
              errors={errors}
              autoCapitalization={currentWorkspace?.autoCapitalization}
            />
            <div className="mt-7 flex items-center">
              <Button
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
                key="layout-create-project-submit"
                className="mr-4"
                type="submit"
              >
                Create Secret
              </Button>
              <Button
                key="layout-cancel-create-project"
                onClick={onClose}
                variant="plain"
                colorSchema="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
};
