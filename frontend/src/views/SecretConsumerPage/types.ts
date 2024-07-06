export enum EConsumerSecretsType {
    Login = "login",
    CreditCard = "credit_card",
    SecureNote = "secure_note",
}

export interface ITypeInfo {
    selected: boolean;
    label: string;
}

export const ConsumerSecretTypes: Record<EConsumerSecretsType, ITypeInfo> = {
    [EConsumerSecretsType.Login]: {label:"Login", selected: true},
    [EConsumerSecretsType.CreditCard]: {label:"Credit Card", selected: true},
    [EConsumerSecretsType.SecureNote]: {label:"Secure Note", selected: true},
}