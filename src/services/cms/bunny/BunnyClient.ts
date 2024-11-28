import { createSlug } from "@/lib/utils";
import { apiConstants, APIResponse, APIServerError } from "@/types/cms/apis";
import { BunnyRequestError, VideoLibrary, VideoLibraryResponse } from "@/types/cms/bunny";
import sharp from "sharp";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export class BunnyClient {
  accessKey: string;
  constructor(accessKey: string) {
    this.accessKey = accessKey;
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
        return new APIResponse<void>(result.ok, result.status, "Added the requested domain name in bunny.net video library");
      })
      .catch((err) => {
        return new APIResponse(false, 500, err);
      });
  };

  uploadWatermark = async (watermarkUrl: string, videoId: number): Promise<APIResponse<void>> => {
    const downloadImg = await fetch(watermarkUrl);
    if (downloadImg.ok) {
      const url = `https://api.bunny.net/videolibrary/${videoId}/watermark`;
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
}
