import prisma from "@/lib/prisma";
import { NextApiResponse, NextApiRequest } from "next";
import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { withMethods } from "@/lib/api-middlewares/with-method";
import { getCookieName } from "@/lib/utils";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { ICourseListItem } from "@/types/courses/Course";
import { APIResponse } from "@/types/apis";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        let cookieName = getCookieName();

        const token = await getToken({
            req,
            secret: process.env.NEXT_PUBLIC_SECRET,
            cookieName,
        });

        const query = req.query;

        const { courseListPreview } = query;


        const publishedCourses = await prisma.course.findMany({
            select: {
                courseId: true,
                name: true,
                difficultyLevel: true,
                state: true,
                description: true,
                totalResources: true,
                previewMode: true,
                tvThumbnail: true,
                coursePrice: true,
                slug: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });


        let courseListItems: ICourseListItem[] = await Promise.all(publishedCourses.map(async c => {
            let userRole: Role = Role.NOT_ENROLLED;
            if (token) {
                if (token.role === Role.ADMIN) {
                    userRole = Role.ADMIN;
                } else if (token.role == Role.AUTHOR && c.user.id == token.id) {
                    userRole = Role.AUTHOR;
                } else {
                    //get the registration details for this course and userId
                    const registrationDetails = await prisma.courseRegistration.count({
                        where: {
                            studentId: token.id,
                            order: {
                                productId: c.courseId
                            }
                        }
                    })
                    if (registrationDetails > 0) {
                        userRole = Role.STUDENT;
                    }
                }
            }
            return {
                id: c.courseId,
                title: c.name,
                slug: c.slug || `${c.courseId}-`,
                description: c.description,
                difficultyLevel: c.difficultyLevel,
                author: c.user.name,
                price: c.coursePrice,
                trailerThumbnail: c.tvThumbnail || undefined,
                currency: 'INR',
                userRole: userRole
            }
        }))

        return res.status(200).json(new APIResponse(true, 200, `Fetched the courses list`, courseListItems))
    } catch (error) {
        console.error(error);
        return errorHandler(error, res);
    }
};

export default withMethods(["GET"], handler);
