import { postFetch } from "@/services/request";
import { APIResponse } from "@/types/apis";
import { BunnyCMSConfig, StorageConfig } from "@/types/cms/bunny";
import { ConfigurationState } from "@prisma/client";

interface ApiResponse {
  success: boolean;
  error: string;
  message: string;
  config: { config: BunnyCMSConfig; state: ConfigurationState };
  regions: { name: string; code: string }[];
}

type FailedApiResponse = {
  error: string;
};

type VODClientConfig = {
  provider: string;
  brandName: string;
  replicatedRegions: string[];
  videoResolutions: string[];
  playerColor: string;
  watermarkUrl: string | undefined;
};

class cmsClient {
  testAccessKey = (
    accessKey: string,
    provider: string,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch({ accessKey, provider }, `/api/v1/admin/config/cms/test`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  addVod = (
    data: VODClientConfig,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(data, `/api/v1/admin/config/cms/vod`).then((result) => {
      if (result.status == 200 || result.status == 201) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  addStorage = (
    config: StorageConfig,
    onSuccess: (response: APIResponse<any>) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(config, `/api/v1/admin/config/cms/storage`).then((result) => {
      if (result.ok) {
        result.json().then((r) => {
          const apiResponse = r as APIResponse<void>;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as APIResponse<void>;
          onFailure(failedResponse.error || "Failed to execute the service");
        });
      }
    });
  };

  getConfigDetail = (
    provider: string,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch({ provider }, `/api/v1/admin/config/cms/get`).then((result) => {
      if (result.status == 200 || result.status == 201) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  listReplicationRegions = (
    accessKey: string,
    provider: string,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch({ accessKey, provider }, `/api/v1/admin/config/cms/regions`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };
}

export default new cmsClient();
