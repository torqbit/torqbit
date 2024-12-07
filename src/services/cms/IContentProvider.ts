import { APIResponse, APIServerError } from "@/types/apis";
import { ConfigurationState } from "@prisma/client";

export type ICMSAuthConfig = {
  accessKey: string;
};
export interface IContentProvider<T extends ICMSAuthConfig, U> {
  provider: string;
  testConfiguration(config: T): Promise<Boolean | APIServerError>;
  getAuthConfig(): Promise<APIResponse<T>>;

  getCMSConfig(): Promise<APIResponse<{ config: U; state: ConfigurationState }>>;

  listReplicationRegions(): Promise<{ name: string; code: string }[]>;
  saveVODConfig(
    authConfig: T,
    brandName: string,
    replicatedRegions: string[],
    videoResolutions: string[],
    playerColor?: string,
    watermarkUrl?: string
  ): Promise<APIResponse<void>>;

  saveCDNConfig(
    authConfig: T,
    brandName: string,
    mainStorageRegion: string,
    replicatedRegions: string[]
  ): Promise<APIResponse<void>>;

  configureObjectStorage(
    authConfig: T,
    brandName: string,
    mainStorageRegion: string,
    replicatedRegions: string[]
  ): Promise<APIResponse<void>>;

  uploadCDNImage(authConfig: T, cmsConfig: U, file: Buffer, path: string): Promise<APIResponse<any>>;
  uploadVideo(authConfig: T, cmsConfig: U, file: Buffer, title: string): Promise<APIResponse<any>>;
}
