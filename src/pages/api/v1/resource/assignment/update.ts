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
    const { lessonId, estimatedDurationInMins, maximumScore, passingScore, details, title } = body;

    let updateAssignmentData: any = {};

    if (details) updateAssignmentData.content = details;
    if (passingScore) updateAssignmentData.passingScore = passingScore;
    if (maximumScore) updateAssignmentData.maximumPoints = maximumScore;
    if (estimatedDurationInMins) updateAssignmentData.estimatedDuration = estimatedDurationInMins;

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
