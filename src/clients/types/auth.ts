import { Address, Hash } from "viem";

const Domain = {
  name: "Namespace",
  version: "1",
};

const Types = {
  SignIn: [
    { name: "principal", type: "string" },
    { name: "nonce", type: "string" },
    { name: "app", type: "string" },
    { name: "issued", type: "uint64" },
    { name: "message", type: "string" },
  ],
};

export interface AuthTokenMessage {
  app: string
  issued: number,
  message: string,
  nonce: string,
  principal: Address,
}

export interface AuthTokenResponse {
  accessToken: string
  refreshToken: string
}

export interface AuthTokenRequest {
  message: AuthTokenMessage;
  signature: Hash;
}

export const AuthTypedData = {
  Domain,
  Types,
}
