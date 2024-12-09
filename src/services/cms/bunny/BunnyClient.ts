import { createSlug } from "@/lib/utils";
import { apiConstants, APIResponse, APIServerError } from "@/types/apis";
import { BunnyRequestError, PullZone, StorageZone, VideoLibrary, VideoLibraryResponse } from "@/types/cms/bunny";
import { VideoInfo } from "@/types/courses/Course";
import { VideoState } from "@prisma/client";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import { VideoObjectType } from "@/types/cms/common";
import { fetchImageBuffer } from "@/actions/fetchImageBuffer";
import { truncateString } from "@/services/helper";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export class BunnyClient {
  accessKey: string;
  vidLibraryUrl: string = "https://video.bunnycdn.com/library";
  constructor(accessKey: string) {
    this.accessKey = accessKey;
    this.vidLibraryUrl = this.vidLibraryUrl;
  }

  getClientHeaders = () => {
    return {
      accept: "application/json",
      "content-type": "application/json",
      AccessKey: this.accessKey,
    };
  };

  getClientFileOptions = (file: Buffer) => {
    return {
      method: "PUT",
      headers: { accept: "application/json", AccessKey: this.accessKey },
      body: file,
    };
  };

  getCDNbaseEndpoint = (region: string) => {
    if (region === "DE") {
      return `storage.bunnycdn.com`;
    } else {
      return `${region.toLowerCase()}.storage.bunnycdn.com`;
    }
  };

  async tryNTimes<T>(
    times: number,
    interval: number,
    toTry: () => Promise<Response>,
    onCompletion: (len: number) => Promise<string>
  ): Promise<any> {
    if (times < 1) throw new Error(`Bad argument: 'times' must be greater than 0, but ${times} was received.`);
    let attemptCount: number;
    for (attemptCount = 1; attemptCount <= times; attemptCount++) {
      try {
        const result = await toTry();
        let vresult = await result.json();
        if (vresult.status != 4) {
          if (attemptCount < times) await delay(interval * 1000);
          else return Promise.reject(result);
        } else {
          return onCompletion(vresult.length);
        }
      } catch (error) {
        console.log(`failed due to : ${error}`);
      }
    }
  }

  trackVideo(
    videoInfo: VideoInfo,
    libraryId: number,
    onCompletion: (videoLen: number) => Promise<string>
  ): Promise<string> {
    return this.tryNTimes(
      120,
      5,
      () => {
        return fetch(`${this.vidLibraryUrl}/${libraryId}/videos/${videoInfo.videoId}`, this.getClientVideoOption());
      },
      onCompletion
    );
  }

  async uploadThumbnailToCDN(
    thumbnail: string,
    linkedHostname: string,
    mainStorageRegion: string,
    zoneName: string
  ): Promise<string | undefined> {
    if (thumbnail.includes(linkedHostname)) {
      let fullName = thumbnail.split("/")[thumbnail.split("/").length - 1];
      const fileBuffer = await fetchImageBuffer(thumbnail);
      if (fileBuffer) {
        const uploadResponse = await this.uploadCDNFile(
          fileBuffer,
          `thumbnail/${fullName}`,
          zoneName,
          mainStorageRegion,
          linkedHostname
        );

        return uploadResponse.body;
      }
    }
  }

  uploadVideo = async (
    file: Buffer,
    libraryId: number,
    title: string,
    linkedHostname: string
  ): Promise<APIResponse<VideoInfo>> => {
    let guid: string;
    const res = await fetch(`${this.vidLibraryUrl}/${libraryId}/videos`, this.getClientPostOptions(title));
    const json = await res.json();

    guid = json.guid;
    const res_1 = await fetch(`${this.vidLibraryUrl}/${libraryId}/videos/${guid}`, this.getClientFileOptions(file));
    const uploadedData = await res_1.json();

    const videoResult = await fetch(`${this.vidLibraryUrl}/${libraryId}/videos/${guid}`, this.getClientVideoOption());
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
        videoId: videoData.guid as string,
        thumbnail: `https://${linkedHostname}/${videoData.guid}/${videoData.thumbnailFileName}`,
        previewUrl: `https://${linkedHostname}/${videoData.guid}/preview.webp`,
        videoUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoData.guid}`,
        mediaProviderName: "bunny",
        state: state as VideoState,
        videoDuration: videoData.length,
      },
    };
  };

  uploadCDNFile = async (
    file: Buffer,
    path: string,
    zoneName: string,
    mainStorageRegion: string,
    linkedHostname: string
  ): Promise<APIResponse<string>> => {
    const res = await fetch(
      `https://${this.getCDNbaseEndpoint(mainStorageRegion)}/${zoneName}/${path}`,
      this.getClientFileOptions(file)
    );
    const uploadRes = await res.json();
    return {
      status: uploadRes.HttpCode,
      message: uploadRes.Message,
      success: uploadRes.HttpCode == 201,
      body: uploadRes.HttpCode == 201 ? `https://${linkedHostname}/${path}` : "",
    };
  };

  getClientPostOptions(title: string) {
    return {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        AccessKey: this.accessKey as string,
      },
      body: JSON.stringify({ title: title }),
    };
  }

  getClientVideoOption() {
    return {
      method: "GET",
      headers: {
        accept: "application/json",
        AccessKey: this.accessKey,
      },
    };
  }

  handleError = async <T>(response: Response): Promise<APIResponse<T>> => {
    if (response.status == 400) {
      const reqError = (await response.json()) as BunnyRequestError;
      return new APIResponse(false, response.status, reqError.Message);
    } else {
      return new APIResponse(false, response.status, "Failed to get response from Bunny Server");
    }
  };

  listVideoLibraries = async () => {
    const url = "https://api.bunny.net/videolibrary?page=1&perPage=1000&includeAccessKey=false";
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        AccessKey: this.accessKey,
      },
    };

    try {
      const result = await fetch(url, options);
      if (result.status == 200) {
        const vidLibs = (await result.json()) as VideoLibrary[];
        return { status: result.status, items: vidLibs } as VideoLibraryResponse;
      } else if (result.status >= 400) {
        const reqError = (await result.json()) as BunnyRequestError;
        return new APIServerError(reqError.Message, result.status);
      } else {
        return new APIServerError("Failed to get response from Bunny Server");
      }
    } catch (err: any) {
      return new APIServerError(err);
    }
  };

  createVideoLibrary = async (brandName: string, replicatedRegions: string[]): Promise<APIResponse<VideoLibrary>> => {
    const url = "https://api.bunny.net/videolibrary";
    const options = {
      method: "POST",
      headers: this.getClientHeaders(),
      body: JSON.stringify({ Name: `${createSlug(brandName)}--videos`, ReplicationRegions: replicatedRegions }),
    };
    try {
      const result = await fetch(url, options);
      if (result.status == 201) {
        const vidLib = (await result.json()) as VideoLibrary;
        return new APIResponse(true, result.status, apiConstants.successMessage, vidLib);
      } else {
        return this.handleError(result);
      }
    } catch (err: any) {
      return new APIResponse(false, err);
    }
  };

  updateVideoLibrary = async (
    libraryId: number,
    playerColor: string,
    resolutions: string[],
    watermarkUrl?: string
  ): Promise<APIResponse<void>> => {
    const url = `https://api.bunny.net/videolibrary/${libraryId}`;
    let objectParams: any = {
      PlayerKeyColor: playerColor,
      EnabledResolutions: resolutions.join(","),
      EnableDRM: true,
    };
    if (watermarkUrl) {
      const downloadImg = await fetch(watermarkUrl);
      if (downloadImg.ok) {
        const file = await downloadImg.arrayBuffer();
        const metadata = await sharp(file).metadata();
        if (metadata.height && metadata.width) {
          // width = 1600 height = 900
          // height =>  1/(width/height)
          const heightInPercent = 10 / (metadata.width / metadata.height);
          const widthInPercent = 10;

          objectParams = {
            ...objectParams,
            WatermarkWidth: widthInPercent,
            WatermarkHeight: heightInPercent,
            WatermarkPositionLeft: 95 - widthInPercent,
            WatermarkPositionTop: 95 - heightInPercent,
          };
        }
      }
    }

    const options = {
      method: "POST",
      headers: this.getClientHeaders(),
      body: JSON.stringify(objectParams),
    };
    try {
      const result = await fetch(url, options);
      if (result.status == 200) {
        return new APIResponse(true, result.status, apiConstants.successMessage);
      } else {
        return this.handleError(result);
      }
    } catch (err: any) {
      return new APIResponse(false, err);
    }
  };

  addAllowedDomainsVOD = async (libraryId: number, domain: string): Promise<APIResponse<void>> => {
    const url = `https://api.bunny.net/videolibrary/${libraryId}/addAllowedReferrer`;

    const options = {
      method: "POST",
      headers: this.getClientHeaders(),
      body: JSON.stringify({ Hostname: domain }),
    };

    return fetch(url, options)
      .then((result) => {
        return new APIResponse<void>(
          result.ok,
          result.status,
          "Added the requested domain name in bunny.net video library"
        );
      })
      .catch((err) => {
        return new APIResponse(false, 500, err);
      });
  };

  getStorageZoneName = (brand: string, isCDN: boolean) => {
    return `${createSlug(brand)}-${isCDN ? "cdn" : "files"}`;
  };

  createStorageZone = async (
    brandName: string,
    mainStorageRegion: string,
    replicatedRegions: string[],
    isCDN: boolean
  ): Promise<APIResponse<StorageZone>> => {
    const url = "https://api.bunny.net/storagezone";
    const options = {
      method: "POST",
      headers: this.getClientHeaders(),
      body: JSON.stringify({
        Name: this.getStorageZoneName(brandName, isCDN),
        Region: mainStorageRegion,
        ReplicationRegions: replicatedRegions,
        ZoneTier: isCDN ? 1 : 0,
      }),
    };
    try {
      const result = await fetch(url, options);
      if (result.status == 201) {
        const body = (await result.json()) as StorageZone;
        return new APIResponse(true, result.status, "Your storage has been configured successfully", body);
      } else {
        return this.handleError(result);
      }
    } catch (err: any) {
      return new APIResponse(false, err);
    }
  };

  createPullZone = async (brandName: string, storageZoneId: number): Promise<APIResponse<PullZone>> => {
    const url = "https://api.bunny.net/pullzone";
    const pullzone = `${createSlug(brandName)}-pz`;

    const options = {
      method: "POST",
      headers: this.getClientHeaders(),
      body: JSON.stringify({
        Name: pullzone,
        StorageZoneId: storageZoneId,
        OriginType: 2,
      }),
    };
    try {
      const result = await fetch(url, options);
      if (result.status == 201) {
        const body = (await result.json()) as PullZone;
        return new APIResponse(true, result.status, apiConstants.successMessage, body);
      } else {
        return this.handleError(result);
      }
    } catch (err: any) {
      return new APIResponse(false, err);
    }
  };

  uploadWatermark = async (
    watermarkUrl: string,
    videoLibId: number,
    update: boolean = false
  ): Promise<APIResponse<void>> => {
    const downloadImg = await fetch(watermarkUrl);
    if (downloadImg.ok) {
      const url = `https://api.bunny.net/videolibrary/${videoLibId}/watermark`;

      if (update) {
        //delete the watermark
        const delOptions = {
          method: "DELETE",
          headers: this.getClientHeaders(),
        };
        const deletionResponse = await fetch(url, delOptions);
        if (deletionResponse.status == 204) {
          console.log(`the watermark for the video library ${videoLibId}`);
        }
      }
      const file = await downloadImg.arrayBuffer();
      const result = await fetch(url, this.getClientFileOptions(Buffer.from(file)));
      if (result.status == 200) {
        return new APIResponse(true);
      } else {
        return await this.handleError(result);
      }
    } else {
      return new APIResponse(false, downloadImg.status, "Failed to download the watermark image");
    }
  };

  deleteWatermark = async (videoLibId: number): Promise<APIResponse<void>> => {
    const delOptions = {
      method: "DELETE",
      headers: this.getClientHeaders(),
    };
    const url = `https://api.bunny.net/videolibrary/${videoLibId}/watermark`;
    const deletionResponse = await fetch(url, delOptions);
    return new APIResponse(
      deletionResponse.status == 204,
      deletionResponse.status,
      "Successfully deleted the watermark"
    );
  };
}
