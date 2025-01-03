import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { getCookieName } from "@/lib/utils";
import { AssignmentConfig } from "@/types/courses/assignment";
import { NextApiRequest, NextApiResponse } from "next";
import AssignmentFileManagement from "@/services/ams/AssignmentFileManagement";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const cookieName = getCookieName();

    const token = await getToken({
      req,
      secret: process.env.NEXT_PUBLIC_SECRET,
      cookieName,
    });
    const query = req.query;
    const { assignmentId, courseId } = query;
    const body = req.body;
    const { codeData } = body;

    const getFileName = await prisma.assignment.findUnique({
      where: {
        lessonId: Number(assignmentId),
      },
    });
  } catch (error) {
    return errorHandler(error, res);
  }
};
export default handler;
