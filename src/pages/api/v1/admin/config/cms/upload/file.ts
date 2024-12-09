import { NextApiResponse, NextApiRequest } from "next";
import { withMethods } from "@/lib/api-middlewares/with-method";
import fs from "fs";

import { ContentManagementService } from "@/services/cms/ContentManagementService";
import { withAuthentication } from "@/lib/api-middlewares/with-authentication";
import { readFieldWithFile } from "@/pages/api/v1/upload/video/upload";
import { createSlug, getFileExtension } from "@/lib/utils";
import { APIResponse } from "@/types/apis";

export const config = {
  api: {
    bodyParser: false,
  },
};
const cms = new ContentManagementService();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { fields, files } = (await readFieldWithFile(req)) as any;

    if (files.file) {
      const name = createSlug(fields.title[0]);
      const fileType = fields.hasOwnProperty("fileType") && fields.fileType[0];
      const extension = getFileExtension(files.file[0].originalFilename);
      const sourcePath = files.file[0].filepath;
      const currentTime = new Date().getTime();
      const fullName = `${name}-${currentTime}.${extension}`;
      const fileBuffer = await fs.promises.readFile(`${sourcePath}`);

      let response: APIResponse<any>;

      const cms = new ContentManagementService().getCMS("bunny.net");
      const authConfig = await cms.getAuthConfig();
      const cmsConfig = await (await cms.getCMSConfig()).body?.config;

      if (authConfig.success && authConfig.body) {
        console.log(`attempting to save the CDN configuration`);
        response = await cms.uploadCDNImage(authConfig.body, cmsConfig, fileBuffer, fullName, fileType);
        if (response.success) {
          return res
            .status(response.status)
            .json({ success: response.success, message: response.message, fileCDNPath: response.body });
        }
      } else {
        return res.status(400).json({ success: false, error: "Authentication configuration was not found" });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: `${error}` });
  }
};

export default withMethods(["POST"], withAuthentication(handler));
