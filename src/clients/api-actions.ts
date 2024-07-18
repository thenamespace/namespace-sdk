import axios from "axios";
import { Listing, MainChain } from "./types";
import { Address, namehash } from "viem";
import {
  L1MintParamsRequest,
  L1MintParamsResponse,
  L2MintParamsRequest,
  L2MintParamsResponse,
  SimulateMintRequest,
  SimulateMintResponse,
} from "./types/minting";
import { AuthTokenRequest, AuthTokenResponse } from "./types/auth";

export interface INamespaceApiActions {
  getListedName(ensName: string, network: MainChain): Promise<Listing>;
  simulateMintParametersRequest(
    request: SimulateMintRequest
  ): Promise<SimulateMintResponse>;
  getMintingL2Parameters(
    params: L2MintParamsRequest,
    minterAddress: Address,
    token?: string
  ): Promise<L2MintParamsResponse>;
  getMintingL1Parameters(
    params: L1MintParamsRequest,
    minterAddress: Address,
    token?: string
  ): Promise<L1MintParamsResponse>;
  getAuthToken(request: AuthTokenRequest): Promise<AuthTokenResponse>;
}

class NamespaceApiActions implements INamespaceApiActions {
  constructor(private readonly backendApi: string) {}

  public async getAuthToken(
    request: AuthTokenRequest
  ): Promise<AuthTokenResponse> {
    return axios
      .post<AuthTokenResponse>(`${this.backendApi}/auth`, request)
      .then((res) => res.data);
  }

  public async getListedName(
    ensName: string,
    network: MainChain
  ): Promise<Listing> {
    const _namehash = namehash(ensName);
    return axios
      .get<Listing>(`${this.backendApi}/api/v1/listings/single`, {
        params: {
          namehash: _namehash,
          network,
        },
      })
      .then((res) => res.data);
  }

  public async getMintingL1Parameters(
    params: L1MintParamsRequest,
    minterAddress: Address,
    token?: string
  ): Promise<L1MintParamsResponse> {
    const result = await this.simulateMintParametersRequest({
      label: params.label,
      minter: minterAddress,
      network: params.network,
      parentLabel: params.parentLabel,
      subnameOwner: params.subnameOwner as Address,
    });

    if (!result.canMint) {
      throw new Error(
        "Could not generate mint parameters, reason: " +
          result.validationErrors[0] || "UNKNOWN_REASON"
      );
    }

    if (result.requiresVerifiedMinter && !token) {
      throw new Error("Minting subname requires token verification.");
    }

    if (result.requiresVerifiedMinter) {
      return axios
        .post<L1MintParamsResponse>(`${this.backendApi}/api/v1/mint/verified`, params, {
          headers: {
            ["x-auth-token"]: token,
          },
        })
        .then((res) => res.data);
    }

    return axios
      .post<L1MintParamsResponse>(`${this.backendApi}/api/v1/mint`, params)
      .then((res) => res.data);
  }

  public async getMintingL2Parameters(
    params: L2MintParamsRequest,
    minterAddress: Address,
    token?: string
  ): Promise<L2MintParamsResponse> {
    const result = await this.simulateMintParametersRequest({
      label: params.label,
      minter: minterAddress,
      network: params.mainNetwork,
      parentLabel: params.parentLabel,
      subnameOwner: params.owner as Address,
    });

    if (!result.canMint) {
      throw new Error(
        "Could not generate mint parameters, reason: " +
          result.validationErrors[0] || "UNKNOWN_REASON"
      );
    }

    if (result.requiresVerifiedMinter && !token) {
      throw new Error("Minting subnames requires token verification.");
    }

    if (result.requiresVerifiedMinter) {
      return axios
        .post<L2MintParamsResponse>(
          `${this.backendApi}/api/v1/mint/l2/verified`,
          params,
          {
            headers: {
              ["x-auth-token"]: token,
            },
          }
        )
        .then((res) => res.data);
    }

    return axios
      .post<L2MintParamsResponse>(`${this.backendApi}/api/v1/mint/l2`, params)
      .then((res) => res.data);
  }

  public async simulateMintParametersRequest(
    request: SimulateMintRequest
  ): Promise<SimulateMintResponse> {
    return axios
      .post<SimulateMintResponse>(
        `${this.backendApi}/api/v1/mint/simulate?minterAddress=${request.minter}`,
        request
      )
      .then((res) => res.data);
  }
}

export const createApiActions = (url: string): INamespaceApiActions => {
  return new NamespaceApiActions(url);
};
