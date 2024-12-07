import { BunnyClient } from "./BunnyClient";
import { baseBunnyConfig, BunnyCMSConfig, BunnyConstants, VideoLibrary } from "@/types/cms/bunny";
import { apiConstants, APIResponse, APIServerError } from "@/types/apis";
import { ICMSAuthConfig, IContentProvider } from "../IContentProvider";
import { ConfigurationState, VideoState } from "@prisma/client";
import SecretsManager from "@/services/secrets/SecretsManager";
import { FileUploadResponse, VideoAPIResponse } from "@/types/courses/Course";

export interface BunnyAuthConfig extends ICMSAuthConfig {
  accessKey: string;
}
const secretsStore = SecretsManager.getSecretsProvider();
const hostURL = new URL(process.env.NEXTAUTH_URL || "https://torqbit.com");

export class BunnyCMS implements IContentProvider<BunnyAuthConfig, BunnyCMSConfig> {
  async getCMSConfig(): Promise<APIResponse<{ config: BunnyCMSConfig; state: ConfigurationState }>> {
    const result = await prisma?.serviceProvider.findUnique({
      select: {
        providerDetail: true,
        state: true,
      },
      where: {
        provider_name: this.provider,
        service_type: this.serviceType,
      },
    });
    if (result && result.providerDetail) {
      return new APIResponse(true, 200, apiConstants.successMessage, {
        config: result.providerDetail as BunnyCMSConfig,
        state: result.state,
      });
    } else {
      return new APIResponse(false, 400, "Failed to fetch the CMS config");
    }
  }
  provider: string = "bunny.net";
  serviceType: string = "cms";

  async saveConfiguration(config: BunnyCMSConfig): Promise<boolean> {
    //based on the config object values, save in the database
    let configId;
    let configState: ConfigurationState = ConfigurationState.AUTHENTICATED;
    if (config.vodConfig) {
      configState = ConfigurationState.VOD_CONFIGURED;
    }

    const existingSP = await prisma?.serviceProvider.findUnique({
      where: {
        service_type: this.serviceType,
      },
    });

    if (existingSP) {
      const result = await prisma?.serviceProvider.update({
        data: {
          provider_name: this.provider,
          providerDetail: config,
          state: configState,
        },
        where: {
          service_type: this.serviceType,
        },
      });
      configId = result?.id;
    } else {
      const result = await prisma?.serviceProvider.create({
        data: {
          service_type: "cms",
          provider_name: this.provider,
          providerDetail: config,
          state: configState,
        },
      });
      configId = result?.id;
    }

    return typeof configId != "undefined";
  }

  async getAuthConfig(): Promise<APIResponse<BunnyAuthConfig>> {
    const accessKey = await secretsStore.get(BunnyConstants.accessKey);
    if (accessKey) {
      return new APIResponse(true, 200, apiConstants.successMessage, { accessKey: accessKey });
    } else {
      return new APIResponse(true, 200, apiConstants.successMessage);
    }
  }

  /**
   * Test and save/update the configuration
   * @param config
   * @returns true if Access Key is valid, throws error if it fails
   */
  testConfiguration(config: BunnyAuthConfig): Promise<Boolean | APIServerError> {
    const bunny = new BunnyClient(config.accessKey);
    return bunny
      .listVideoLibraries()
      .then(async (r) => {
        if (r.status == 200) {
          //save the configuration in database

          secretsStore.put(baseBunnyConfig.accessKeyRef, config.accessKey);
          this.saveConfiguration(baseBunnyConfig);

          return new Boolean(true);
        } else {
          return r as APIServerError;
        }
      })
      .catch((err) => new APIServerError(err));
  }

  listReplicationRegions(): Promise<{ name: string; code: string }[]> {
    return new Promise((resolve, reject) => {
      resolve([
        { name: "London, UK", code: "UK" },
        { name: "New York, US", code: "NY" },
        { name: "Sydney, Oceania", code: "SYD" },
        { name: "Singapore, Asia", code: "SG" },
        { name: "Johannesburg, Africa", code: "JH" },
        { name: "Sao Paulo, LATAM", code: "BR" },
        { name: "Los Angeles, US West", code: "LA" },
        { name: "Falkenstein, Europe", code: "DE" },
        { name: "Stockholm, Europe", code: "SY" },
      ]);
    });
  }

  /**
   * Saves the configuration to database
   * @param authConfig
   * @param replicatedRegions
   * @param allowedDomains
   * @param videoResolutions
   * @param watermarkFile
   */
  saveVODConfig(
    authConfig: BunnyAuthConfig,
    brandName: string,
    replicatedRegions: string[],
    videoResolutions: string[],
    playerColor: string,
    watermarkUrl?: string
  ): Promise<APIResponse<void>> {
    //create a Bunny client and create a video library with the above settings
    const bunny = new BunnyClient(authConfig.accessKey);

    //get the bunny cms config with status set as VOD_CONFIGURED
    const result = prisma?.serviceProvider
      .findUnique({
        select: {
          providerDetail: true,
        },
        where: {
          provider_name: this.provider,
          service_type: this.serviceType,
          state: ConfigurationState.VOD_CONFIGURED,
        },
      })
      .then(async (dbConfig) => {
        if (dbConfig && dbConfig.providerDetail) {
          const bunnyConfig = dbConfig.providerDetail as BunnyCMSConfig;
          if (bunnyConfig.vodConfig) {
            if (watermarkUrl && watermarkUrl.startsWith("http")) {
              await bunny.uploadWatermark(watermarkUrl, bunnyConfig.vodConfig.vidLibraryId, true);
            } else if (bunnyConfig.vodConfig.watermarkUrl && typeof watermarkUrl == "undefined") {
              //delete the water mark
              await bunny.deleteWatermark(bunnyConfig.vodConfig.vidLibraryId);
            }

            //update the resolutions and player color and watermark
            await bunny.updateVideoLibrary(
              bunnyConfig.vodConfig.vidLibraryId,
              playerColor,
              videoResolutions,
              watermarkUrl
            );

            //update the allowed domains
            await bunny.addAllowedDomainsVOD(bunnyConfig.vodConfig.vidLibraryId, hostURL.hostname);
            const updatedBunnyConfig = {
              ...bunnyConfig,
              vodConfig: {
                ...bunnyConfig.vodConfig,
                videoResolutions: videoResolutions,
                watermarkUrl: watermarkUrl,
              },
            };
            this.saveConfiguration(updatedBunnyConfig);
            return new APIResponse<void>(true);
          } else {
            return new APIResponse<void>(false, 400, "Failed to find VOD configuration in the database");
          }
        } else {
          //Unable to find the VOD Config. Create a new VOD configuration
          return bunny.createVideoLibrary(brandName, replicatedRegions).then((result) => {
            if (result.success && result.body) {
              //upload the watermark url
              if (watermarkUrl && watermarkUrl.startsWith("http")) {
                bunny.uploadWatermark(watermarkUrl, result.body.Id);
              }

              //update the resolutions and the alowed domains
              bunny.updateVideoLibrary(result.body.Id, playerColor, videoResolutions, watermarkUrl);

              //update the allowed domains
              bunny.addAllowedDomainsVOD(result.body.Id, hostURL.hostname);

              //add the VOD access key
              secretsStore.put(BunnyConstants.vodAccessKey, result.body.ApiKey);

              //save the bunny config
              const bunnyConfig: BunnyCMSConfig = {
                ...baseBunnyConfig,
                vodConfig: {
                  vidLibraryId: result.body.Id,
                  replicatedRegions: replicatedRegions,
                  videoResolutions: videoResolutions,
                  watermarkUrl: watermarkUrl,
                },
              };
              this.saveConfiguration(bunnyConfig);
              return new APIResponse<void>(result.success, result.status, result.message);
            } else {
              return new APIResponse<void>(result.success, result.status, result.message);
            }
          });
        }
      })
      .catch((err) => {
        return new APIResponse<void>(false, 500, err);
      });
    return (
      result ||
      new Promise((resolve, _) => {
        resolve(new APIResponse<void>(false, 500, "Failed to create prisma client"));
      })
    );
  }

  async saveCDNConfig(
    authConfig: BunnyAuthConfig,
    brandName: string,
    mainStorageRegion: string,
    replicatedRegions: string[]
  ): Promise<APIResponse<void>> {
    const bunny = new BunnyClient(authConfig.accessKey);

    //get the bunny cms config with status set as VOD_CONFIGURED
    const result = await prisma?.serviceProvider.findUnique({
      select: {
        providerDetail: true,
        state: true,
        id: true,
      },
      where: {
        provider_name: this.provider,
        service_type: this.serviceType,
      },
    });
    if (
      result &&
      result.providerDetail &&
      (result.state == ConfigurationState.CDN_CONFIGURED || result.state == ConfigurationState.STORAGE_CONFIGURED)
    ) {
      //no work
      return new APIResponse(false, 400, "CDN Configuration can't be updated");
    } else if (result && result.providerDetail) {
      //create the cdn storage zone
      const cdnStorageZone = await bunny.createStorageZone(brandName, mainStorageRegion, replicatedRegions, true);
      if (cdnStorageZone.success && cdnStorageZone.body) {
        const cdnPullZone = await bunny.createPullZone(brandName, cdnStorageZone.body.Id);
        if (cdnPullZone.success && cdnPullZone.body) {
          //save the cdn storage zone passsword
          await secretsStore.put(BunnyConstants.cdnStoragePassword, cdnStorageZone.body.Password);

          //save the cdn pullzone
          const existingConfig = result.providerDetail as BunnyCMSConfig;
          const updatedConfig = {
            ...existingConfig,
            cdnConfig: {
              cdnStorageZoneId: cdnStorageZone.body.Id,
              cdnPullZoneId: cdnPullZone.body.Id,
              linkedHostname: cdnPullZone.body.Hostnames[0].Value,
            },
          };
          await prisma?.serviceProvider.update({
            data: {
              providerDetail: updatedConfig,
              state: ConfigurationState.CDN_CONFIGURED,
            },
            where: {
              id: result.id,
            },
          });
        }
        return new APIResponse(cdnPullZone.success, cdnPullZone.status, cdnPullZone.message);
      }

      return new APIResponse(cdnStorageZone.success, cdnStorageZone.status, cdnStorageZone.message);
    } else {
      return new APIResponse(false, 404, "No Configuration found for the CMS");
    }
  }

  async configureObjectStorage(
    authConfig: BunnyAuthConfig,
    brandName: string,
    mainStorageRegion: string,
    replicatedRegions: string[]
  ): Promise<APIResponse<void>> {
    const bunny = new BunnyClient(authConfig.accessKey);

    //get the bunny cms config with status set as VOD_CONFIGURED
    const result = await prisma?.serviceProvider.findUnique({
      select: {
        providerDetail: true,
        state: true,
        id: true,
      },
      where: {
        provider_name: this.provider,
        service_type: this.serviceType,
      },
    });
    if (result && result.providerDetail && result.state == ConfigurationState.STORAGE_CONFIGURED) {
      //no work
      return new APIResponse(false, 400, "Storage Configuration can't be updated");
    } else if (result && result.providerDetail) {
      const objectStorageZone = await bunny.createStorageZone(brandName, mainStorageRegion, replicatedRegions, false);
      if (objectStorageZone.success && objectStorageZone.body) {
        await secretsStore.put(BunnyConstants.fileStoragePassword, objectStorageZone.body.Password);

        //save the cdn pullzone
        const existingConfig = result.providerDetail as BunnyCMSConfig;
        const updatedConfig = {
          ...existingConfig,
          storageConfig: {
            storageZoneId: objectStorageZone.body.Id,
            mainStorageRegion: mainStorageRegion,
            replicatedRegions: replicatedRegions,
          },
        };

        await prisma?.serviceProvider.update({
          data: {
            providerDetail: updatedConfig,
            state: ConfigurationState.STORAGE_CONFIGURED,
          },
          where: {
            id: result.id,
          },
        });
      }
      return new APIResponse(objectStorageZone.success, objectStorageZone.status, objectStorageZone.message);
    } else {
      return new APIResponse(false, 400, "No configuration found for the content management system");
    }
  }

  async uploadCDNImage(
    authConfig: BunnyAuthConfig,
    cmsConfig: BunnyCMSConfig,
    file: Buffer,
    path: string
  ): Promise<APIResponse<string>> {
    //get the storage password
    const storagePassword = await secretsStore.get(cmsConfig.cdnStoragePasswordRef);
    if (storagePassword) {
      const bunny = new BunnyClient(storagePassword);

      const res = await fetch(
        bunny.getClientFileUrl(cmsConfig.cdnConfig?.cdnStorageZoneId as number, "static", path),
        bunny.getClientFileOptions(file)
      );
      const uploadRes = await res.json();
      const fullPath = `static/${path}`;

      return {
        status: uploadRes.HttpCode,
        message: uploadRes.Message,
        success: uploadRes.HttpCode == 201,
        body: uploadRes.HttpCode == 201 ? `https://${cmsConfig.cdnConfig?.linkedHostname}/${fullPath}` : "",
      };
    }
    throw new Error("Method not implemented.");
  }

  async uploadVideo(
    authConfig: BunnyAuthConfig,
    cmsConfig: BunnyCMSConfig,
    file: Buffer,
    title: string
  ): Promise<APIResponse<VideoAPIResponse>> {
    const videoPassword = await secretsStore.get(cmsConfig.vodAccessKeyRef);
    if (videoPassword) {
      const bunny = new BunnyClient(videoPassword);

      let guid: string;
      const res = await fetch(
        bunny.getClientVideoUrl(cmsConfig.vodConfig?.vidLibraryId as number),
        bunny.getClientPostOptions(title)
      );
      const json = await res.json();
      guid = json.guid;
      const res_1 = await fetch(
        bunny.getClientVideoUploadUrl(json.guid, cmsConfig.vodConfig?.vidLibraryId as number),
        bunny.getClientFileOptions(file)
      );
      const uploadedData = await res_1.json();

      const videoResult = await fetch(
        bunny.getClientVideoUploadUrl(guid, cmsConfig.vodConfig?.vidLibraryId as number),
        bunny.getClientVideoOption()
      );
      let videoData = await videoResult.json();
      let state: string = "";
      if (videoData.status === 0 || videoData.status === 1 || videoData.status === 2 || videoData.status === 3) {
        state = VideoState.PROCESSING;
      }
      if (videoData.status === 4) {
        state = VideoState.READY;
      }
      if (videoData.status === 5 || videoData.status === 6) {
        state = VideoState.FAILED;
      }
      return {
        status: videoResult.status,
        success: videoResult.status == 200,
        message: videoResult.statusText,
        body: {
          statusCode: videoResult.status,
          success: videoResult.status == 200,
          message: videoResult.statusText,
          video: {
            videoId: videoData.guid as string,
            thumbnail: `https://${cmsConfig.cdnConfig?.linkedHostname}/${videoData.guid}/${videoData.thumbnailFileName}`,
            previewUrl: `https://${cmsConfig.cdnConfig?.linkedHostname}/${videoData.guid}/preview.webp`,
            videoUrl: `https://iframe.mediadelivery.net/embed/${cmsConfig.vodConfig?.vidLibraryId}/${videoData.guid}`,
            mediaProviderName: "bunny",
            state: state as VideoState,
            videoDuration: videoData.length,
          },
        },
      };
    }
    throw new Error("Method not implemented.");
  }
}
