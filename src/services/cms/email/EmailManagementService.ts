import SecretsManager from "../../secrets/SecretsManager";
import { APIResponse } from "@/types/apis";
import { IEmailCredentials } from "@/types/cms/email";
import emailService from "@/services/MailerService";
import prisma from "@/lib/prisma";
import { ServiceType } from "@prisma/client";
import { IPrivateCredentialInfo } from "@/types/mail";
import MailerService from "@/services/MailerService";

export const emailConstantsVariable = {
  SMTP_HOST: "SMTP_HOST",
  SMTP_USER: "SMTP_USER",
  SMTP_PASSWORD: "SMTP_PASSWORD",
  SMTP_FROM_EMAIL: "SMTP_FROM_EMAIL",
};
class EmailManagemetService {
  serviceType: ServiceType = ServiceType.EMAIL;

  getMailerService = async (): Promise<emailService> => {
    try {
      const providerDetail = await this.getEmailCredentials();
      if (providerDetail.body) {
        const ms = new MailerService(providerDetail.body);
        return ms;
      } else {
        throw new Error(`Mailer service credential not found`);
      }
    } catch (error: any) {
      throw new Error(`something went wrong dur to ${error}`);
    }
  };
  getEmailCredentials = async (): Promise<APIResponse<IPrivateCredentialInfo>> => {
    try {
      const secretStore = SecretsManager.getSecretsProvider();
      const smtpHost = await secretStore.get(emailConstantsVariable.SMTP_HOST);
      const smtpUser = await secretStore.get(emailConstantsVariable.SMTP_USER);
      const smtpPassword = await secretStore.get(emailConstantsVariable.SMTP_PASSWORD);

      const smtpFromEmail = await secretStore.get(emailConstantsVariable.SMTP_FROM_EMAIL);

      if (!smtpHost || !smtpUser || !smtpFromEmail || !smtpPassword) {
        return {
          success: false,
          error: "Email credentials not found",
          message: "Email credentials not found",
          status: 400,
        };
      }
      return {
        success: true,
        body: { smtpHost, smtpUser, smtpFromEmail, smtpPassword },
        message: "Successfully fetched the email configuration",
        status: 200,
      };
    } catch (error: any) {
      return { success: false, error: "error", message: error.message, status: 400 };
    }
  };

  verifyEmailCredentialsAndSave = async (
    emailConfig: IEmailCredentials,
    name: string,
    email: string
  ): Promise<APIResponse<void>> => {
    try {
      const providerDetail = await this.getEmailCredentials();
      let result: any;
      if (providerDetail.body) {
        const es = new emailService(providerDetail.body);
        result = await es.sendMail("TEST_EMAIL_CREDENIDTIALS", { credendials: emailConfig, name, email });
      }

      const secretStore = SecretsManager.getSecretsProvider();
      if (result && result.success) {
        await secretStore.put(emailConstantsVariable.SMTP_HOST, emailConfig.smtpHost);
        await secretStore.put(emailConstantsVariable.SMTP_USER, emailConfig.smtpUser);
        await secretStore.put(emailConstantsVariable.SMTP_PASSWORD, emailConfig.smtpPassword);
        await secretStore.put(emailConstantsVariable.SMTP_FROM_EMAIL, emailConfig.smtpFromEmail);
        await prisma.serviceProvider.create({
          data: {
            provider_name: emailConfig.smtpHost,
            service_type: this.serviceType,
            providerDetail: {},
            state: "EMAIL_CONFIGURED",
          },
        });
        return new APIResponse<void>(true, 200, `Successfully saved the email configuration`);
      } else {
        return new APIResponse<void>(false, 400, result?.error);
      }
    } catch (error: any) {
      return { success: false, error: "error", message: error.message, status: 400 };
    }
  };
}

export default new EmailManagemetService();
