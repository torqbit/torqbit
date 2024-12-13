import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { withUserAuthorized } from "@/lib/api-middlewares/with-authorized";
import { withMethods } from "@/lib/api-middlewares/with-method";
import { $Enums } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const body = req.body;

    const { lessonId, title, content, state, assignmentFiles, estimatedDuration, submissionType } = body;

    let assignmentData: any = {};

    if (content) assignmentData.content = content;
    if (lessonId) assignmentData.lessonId = lessonId;

    if (assignmentFiles) assignmentData.assignmentFiles = assignmentFiles;
    if (submissionType) assignmentData.submissionType = submissionType;
    if (estimatedDuration) assignmentData.estimatedDuration = estimatedDuration;

    if (title) {
      await prisma?.resource.update({
        where: {
          resourceId: body.lessonId,
        },
        data: {
          name: title,
        },
      });
    }

    await prisma?.assignment.create({
      data: assignmentData,
    });

    return res.json({ success: true, message: "Assignment has been created" });
  } catch (error) {
    return errorHandler(error, res);
  }
};
export default withMethods(["POST"], withUserAuthorized(handler));
