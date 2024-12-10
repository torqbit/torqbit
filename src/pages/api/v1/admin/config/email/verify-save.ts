import { NextApiResponse, NextApiRequest } from "next";
import { withMethods } from "@/lib/api-middlewares/with-method";
import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { withUserAuthorized } from "@/lib/api-middlewares/with-authorized";
import { emailCredentials } from "@/types/cms/email";
import { EmailManagemetService } from "@/services/cms/email/EmailManagementService";
import { getToken } from "next-auth/jwt";
import { getCookieName } from "@/lib/utils";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    let cookieName = getCookieName();
    const token = await getToken({
      req,
      secret: process.env.NEXT_PUBLIC_SECRET,
      cookieName,
    });
    const body = await req.body;
    const accessConfig = emailCredentials.parse(body);
    const emailManager = new EmailManagemetService();
    const result = await emailManager.verifyEmailCredentialsAndSave(accessConfig, token?.name as string, token?.email as string);
    return res.status(result.status).json(result);
  } catch (error) {
    return errorHandler(error, res);
  }
};

export default withMethods(["POST"], withUserAuthorized(handler));
