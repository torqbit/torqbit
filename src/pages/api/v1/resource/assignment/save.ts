import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { withUserAuthorized } from "@/lib/api-middlewares/with-authorized";
import { withMethods } from "@/lib/api-middlewares/with-method";
import { $Enums } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { AssignmentCreateRequest } from "@/types/courses/assignment";
import { JsonObject } from "@prisma/client/runtime/library";
import { APIResponse } from "@/types/apis";
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const body = req.body as AssignmentCreateRequest;

    const { lessonId, assingmentType, estimatedDurationInMins, details, maximumScore, passingScore } = body;
    const unDetails = details as any;
    const lessonCount = await prisma.assignment.count({
      where: {
        lessonId: lessonId
      }
    });

    if (lessonCount > 0) {
      await prisma.assignment.update({
        data: {
          content: unDetails as JsonObject,
          estimatedDuration: estimatedDurationInMins,
          maximumPoints: maximumScore,
          passingScore: passingScore
        },
        where: {
          lessonId: lessonId
        }
      })

      return res.status(200).json(new APIResponse(true, 200, 'Assignment has been updated'));
    } else {
      await prisma.assignment.create({
        data: {
          content: unDetails as JsonObject,
          estimatedDuration: estimatedDurationInMins,
          maximumPoints: maximumScore,
          passingScore: passingScore,
          lessonId: lessonId
        }
      })
      return res.json({ success: true, message: "Assignment has been created" });
    }
  } catch (error) {
    return errorHandler(error, res);
  }
};
export default withMethods(["POST"], withUserAuthorized(handler));
