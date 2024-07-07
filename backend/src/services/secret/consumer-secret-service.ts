import { TConsumerSecretDALFactory } from "./consumer-secret-dal";

type TConsumerSecretServiceFactoryDep = {
  consumerSecretDAL: TConsumerSecretDALFactory;
};

export type TConsumerSecretServiceFactory = ReturnType<typeof consumerSecretFactory>;

export const consumerSecretFactory: (deps: TConsumerSecretServiceFactoryDep) => void = () => {
  const getConsumerSecrets = async () => {
    throw new Error("Not implemented");
    // return consumerSecretDAL.getConsumerSecrets({
    //   actorId,
    //   projectId,
    //   actor,
    //   actorOrgId,
    //   actorAuthMethod,
    //   includeImports
    // });
  };

  return {
    getConsumerSecrets
  };
};
