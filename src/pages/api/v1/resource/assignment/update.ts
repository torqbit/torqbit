import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { withUserAuthorized } from "@/lib/api-middlewares/with-authorized";
import { withMethods } from "@/lib/api-middlewares/with-method";

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

    let updateAssignmentData: any = {};

    if (content) updateAssignmentData.content = content;
    if (assignmentFiles) updateAssignmentData.assignmentFiles = assignmentFiles;
    if (submissionType) updateAssignmentData.submissionType = submissionType;
    if (estimatedDuration) updateAssignmentData.estimatedDuration = estimatedDuration;

    const currentDate = new Date();

    if (title) {
      await prisma?.resource.update({
        where: {
          resourceId: lessonId,
        },
        data: {
          name: title,
        },
      });
    }

    const assignmentDetail = await prisma?.assignment.update({
      where: {
        lessonId: Number(lessonId),
      },
      data: {
        submissionType: submissionType,
        ...updateAssignmentData,
        updatedAt: currentDate,
      },
    });

    return res.json({ success: true, message: " Assignment detail has been updaed", assignmentDetail });
  } catch (error) {
    return errorHandler(error, res);
  }
};

export default withMethods(["POST"], withUserAuthorized(handler));
