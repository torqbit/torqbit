import { postFetch } from "@/services/request";

interface ApiResponse {
  success: boolean;
  error: string;
  message: string;
  regions: { name: string; code: string }[];
}

type FailedApiResponse = {
  error: string;
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
