import { Application, Client, User } from "./models";

export type LicenseStatus =
  | "active"
  | "expired"
  | "revoked"
  | "suspended"
  | "renewed";

export interface SourceKey {
  android?: string;
  ios?: string;
}

export interface LicenseFormData {
  application: Application; // Application ID
  client: Client; // Client ID
  cem: User; // CEM ID
  grace_period: string | number;
  source_key: {
    android?: string;
    ios?: string;
  };
  expiry: Date | null;
  status?: LicenseStatus;
  extension_period?: string;
}

export interface License {
  _id: string;
  licenseKey: string;
  application: {
    _id: string;
    name: string;
    appId: string;
    description: string;
  };
  client: {
    _id: string;
    name: string;
    email: string;
    code: string;
  };
  cem: {
    id: string;
    name: string;
    email: string;
    empCode: string;
  };
  expiry: string;
  status: LicenseStatus;
  grace_period: number;
  source_key: SourceKey;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseSubmitData {
  application: Application; // Application ID
  client: Client; // Client ID
  cem: User; // CEM ID
  grace_period: number;
  source_key: SourceKey;
  expiry: string;
  status?: LicenseStatus;
  extension_period?: string;
}
