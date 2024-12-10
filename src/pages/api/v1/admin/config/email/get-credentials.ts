import { NextApiResponse, NextApiRequest } from "next";
import { withMethods } from "@/lib/api-middlewares/with-method";
import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { withUserAuthorized } from "@/lib/api-middlewares/with-authorized";
import { EmailManagemetService } from "@/services/cms/email/EmailManagementService";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const emailManager = new EmailManagemetService();
    const result = await emailManager.getEmailCredentials();
    return res.status(result.status).json(result);
  } catch (error) {
    return errorHandler(error, res);
  }
};

export default withMethods(["GET"], withUserAuthorized(handler));
