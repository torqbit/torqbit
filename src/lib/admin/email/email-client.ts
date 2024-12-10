import { getFetch, postFetch } from "@/services/request";
import { APIResponse } from "@/types/apis";
import { IEmailCredentials } from "@/types/cms/email";
import { CFPaymentsConfig, PaymentAuthConfig, PaymentInfoConfig } from "@/types/payment";
import { $Enums, ConfigurationState } from "@prisma/client";

class EmailClient {
  saveAndTestEmailCredentials = (
    emailConfig: IEmailCredentials,
    onSuccess: (response: APIResponse<any>) => void,
    onFailure: (err: string) => void
  ) => {
    postFetch(emailConfig, `/api/v1/admin/config/email/verify-save`)
      .then(async (result) => {
        const response = (await result.json()) as APIResponse<any>;
        if (response.success) {
          onSuccess(response);
        } else {
          onFailure(response.error || `Unable to verify and save email credentials`);
        }
      })
      .catch((err) => {
        onFailure(err);
      });
  };

  getEmailCredendialsConfig = (
    onSuccess: (response: APIResponse<{ body: IEmailCredentials }>) => void,
    onFailure: (err: string) => void
  ) => {
    getFetch(`/api/v1/admin/config/email/get-credentials`)
      .then(async (result) => {
        const response = (await result.json()) as APIResponse<{ body: IEmailCredentials }>;
        if (response.success) {
          onSuccess(response);
        } else {
          onFailure(response.error || `Unable to get email credentials`);
        }
      })
      .catch((err) => {
        onFailure(err);
      });
  };

  updateEmailConfig = (config: IEmailCredentials, onSuccess: (response: APIResponse<any>) => void, onFailure: (err: string) => void) => {
    postFetch(config, `/api/v1/admin/config/payments/configure`)
      .then(async (result) => {
        const response = (await result.json()) as APIResponse<any>;
        if (response.success) {
          onSuccess(response);
        } else {
          onFailure(response.error || `Unable to save the payment gateway configuration`);
        }
      })
      .catch((err) => {
        onFailure(err);
      });
  };
}

export default new EmailClient();
