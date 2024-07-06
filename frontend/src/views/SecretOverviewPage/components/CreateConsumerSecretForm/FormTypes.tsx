import { ChangeEvent, useState } from "react";
import { Control, Controller, FieldErrors, UseFormRegister } from "react-hook-form";

import { FormControl, Input, TextArea } from "@app/components/v2";
import { InfisicalSecretInput } from "@app/components/v2/InfisicalSecretInput";
import { Select, SelectItem } from "@app/components/v2/Select";

import { CardType, genRange, validateCard } from "./utils";

type Props = {
  control: Control<any>;
  errors: FieldErrors<any>;
  register: UseFormRegister<any>;
  autoCapitalization?: boolean;
};

export const LoginPasswordFormController: React.FC<Props> = ({
  register,
  control,
  errors,
  autoCapitalization = false
}: Props) => {
  return (
    <>
      <FormControl label="Username" isError={Boolean(errors?.key)} errorText={errors?.key?.message}>
        <Input
          {...register("username")}
          placeholder="Your username"
          autoCapitalization={autoCapitalization}
        />
      </FormControl>
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <FormControl
            label="Password"
            isError={Boolean(errors?.value)}
            errorText={errors?.value?.message}
          >
            <InfisicalSecretInput
              {...field}
              containerClassName="text-bunker-300 hover:border-primary-400/50 border border-mineshaft-600 bg-mineshaft-900 px-2 py-1.5"
            />
          </FormControl>
        )}
      />
    </>
  );
};

export const CreditCardFormController: React.FC<Props> = ({
  register,
  control,
  errors,
  autoCapitalization = false
}: Props) => {
  const currentYear = new Date().getFullYear();
  const expiryYearRange = genRange(currentYear - 10, currentYear + 10, true);
  const [isCardValid, setIsCardValid] = useState<{ isValid: boolean; cardType: CardType }>({
    isValid: true,
    cardType: "Unknown"
  });

  const ValidateCardOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const cardNumber = e.target.value;
    const res = validateCard(cardNumber);
    setIsCardValid(res);
  };

  return (
    <>
      <FormControl
        label="Card Number"
        isError={Boolean(errors?.key)}
        errorText={String(errors?.key?.message || "")}
      >
        <Input
          {...register("cardnumber")}
          placeholder="1234 5678 9012"
          autoCapitalization={autoCapitalization}
          // TODO: Fix validation
          onChange={ValidateCardOnChange}
        />
      </FormControl>
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center justify-between space-x-2 align-bottom">
          <FormControl isError={Boolean(errors?.key)} errorText={errors?.key?.message}>
            <Select
              placeholder="Month"
              {...register("expiry_month")}
              autoCapitalization={autoCapitalization}
              className="text-sm font-medium text-primary/80 hover:text-primary"
              dropdownContainerClassName="text-bunker-200 bg-mineshaft-800 border border-mineshaft-600 drop-shadow-2xl"
            >
              {genRange(1, 12).map((month) => (
                <SelectItem value={String(month)} key={month}>
                  {month}
                </SelectItem>
              ))}
            </Select>
          </FormControl>
          <p className="text-center text-lg text-bunker-200"> / </p>
          <FormControl isError={Boolean(errors?.key)} errorText={errors?.key?.message}>
            <Select
              placeholder="Year"
              {...register("expiry_year")}
              autoCapitalization={autoCapitalization}
              className="text-sm font-medium text-primary/80 hover:text-primary"
              dropdownContainerClassName="text-bunker-200 bg-mineshaft-800 border border-mineshaft-600 drop-shadow-2xl"
            >
              {expiryYearRange.map((year) => (
                <SelectItem value={String(year)} key={year}>
                  {year}
                </SelectItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <Controller
          control={control}
          name="Security Code"
          render={({ field }) => (
            <FormControl
              label="Security Code"
              isError={Boolean(errors?.value) && isCardValid}
              errorText={errors?.value?.message}
            >
              <InfisicalSecretInput
                {...field}
                containerClassName="text-bunker-300 hover:border-primary-400/50 border border-mineshaft-600 bg-mineshaft-900 px-2 py-1.5"
              />
            </FormControl>
          )}
        />
      </div>
      <FormControl
        label="Cardholder's Name"
        isError={Boolean(errors?.key)}
        errorText={errors?.key?.message}
      >
        <Input
          {...register("cardholder_name")}
          placeholder="Card's Name"
          autoCapitalization={autoCapitalization}
        />
      </FormControl>
    </>
  );
};

export const SecureNoteFormController: React.FC<Props> = ({ control, errors }: Props) => {
  return (
    <Controller
      control={control}
      name="Security Code"
      render={({ field }) => (
        <FormControl
          label="Security Code"
          isError={Boolean(errors?.value)}
          errorText={errors?.value?.message}
        >
          <TextArea
            {...field}
            className="border border-mineshaft-600 bg-mineshaft-900 px-2 py-1.5 text-bunker-300 hover:border-primary-400/50"
            placeholder="Your secrets here... we won't tell anyone!"
          />
        </FormControl>
      )}
    />
  );
};

export enum ConsumerSecretType {
  LoginPassword = "loginPassword",
  CreditCard = "creditCard",
  SecureNote = "secureNote"
}

type VariableConsFormControllerProps = {
  formType: ConsumerSecretType;
} & Props;

export const VariableConsFormController: React.FC<VariableConsFormControllerProps> = ({ formType, ...props }:VariableConsFormControllerProps) => {
  switch (formType) {
    case ConsumerSecretType.LoginPassword:
      return <LoginPasswordFormController {...props} />;
    case ConsumerSecretType.CreditCard:
      return <CreditCardFormController {...props} />;
    case ConsumerSecretType.SecureNote:
      return <SecureNoteFormController {...props} />;
    default:
      return <LoginPasswordFormController {...props} />;
  }
};
