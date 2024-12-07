import { NextApiResponse, NextApiRequest } from "next";
import { withMethods } from "@/lib/api-middlewares/with-method";
import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { z } from "zod";
import { APIResponse } from "@/types/apis";
import { ContentManagementService } from "@/services/cms/ContentManagementService";
import { withUserAuthorized } from "@/lib/api-middlewares/with-authorized";

const vodConfig = z.object({
  provider: z.string().min(2, "Provider is required"),
  brandName: z.string().min(2, "Brand name is required"),
  replicatedRegions: z.array(z.string()).min(1, "Atleast one region must be specified"),
  videoResolutions: z.array(z.string()),
  playerColor: z.string(),
  watermarkUrl: z.string().optional(),
});

export type VODConfig = z.infer<typeof vodConfig>;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const body = await req.body;
    let response: APIResponse<any>;
    const config: VODConfig = vodConfig.parse(body);
    const cms = new ContentManagementService().getCMS(config.provider);
    const authConfig = await cms.getAuthConfig();

    if (authConfig.success && authConfig.body) {
      response = await cms.saveVODConfig(
        authConfig.body,
        config.brandName,
        config.replicatedRegions,
        config.videoResolutions,
        config.playerColor,
        config.watermarkUrl
      );
    } else {
      response = authConfig;
    }
    return res.status(response.status).json({ success: response.success, message: response.message });
  } catch (error) {
    return errorHandler(error, res);
  }
};

export default withMethods(["POST"], withUserAuthorized(handler));
