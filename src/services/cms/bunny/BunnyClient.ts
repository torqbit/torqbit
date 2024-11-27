import { createSlug } from "@/lib/utils";
import { apiConstants, APIResponse, APIServerError } from "@/types/cms/apis";
import { BunnyRequestError, VideoLibrary, VideoLibraryResponse } from "@/types/cms/bunny";

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
      console.log(result);
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
    hasWaterMark: boolean
  ): Promise<APIResponse<void>> => {
    const url = `https://api.bunny.net/videolibrary/${libraryId}`;
    const options = {
      method: "POST",
      headers: this.getClientHeaders(),
      body: JSON.stringify({ PlayerKeyColor: playerColor, EnabledResolutions: resolutions.join(","), EnableDRM: true }),
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

  addAllowedDomainsVOD = async (libraryId: number, allowedDomains: string[]): Promise<APIResponse<void>> => {
    const url = `https://api.bunny.net/videolibrary/${libraryId}/addAllowedReferrer`;
    let results: boolean[] = [];
    const promises = allowedDomains.map((domain) => {
      const options = {
        method: "POST",
        headers: this.getClientHeaders(),
        body: JSON.stringify({ Hostname: domain }),
      };

      return fetch(url, options).then((result) => {
        console.log(`${new Date().toISOString()} status for ${domain} - ${result.status}`);

        return result.ok;
      });
    });
    for (let promise of promises) {
      let r = await delay(2000).then(() => promise);
      results.push(r);
    }
    return new APIResponse(results.filter((r) => !r).length > 0, 200);
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
