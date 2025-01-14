import prisma from "@/lib/prisma";
import { NextApiResponse, NextApiRequest } from "next";
import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { withMethods } from "@/lib/api-middlewares/with-method";
import { withUserAuthorized } from "@/lib/api-middlewares/with-authorized";
import { createSlug, getFileExtension } from "@/lib/utils";
import fs from "fs";
import path from "path";
import { APIResponse } from "@/types/apis";
import { readFieldWithSingleFile } from "@/lib/upload/utils";
import { ContentManagementService } from "@/services/cms/ContentManagementService";
import appConstant from "@/services/appConstant";
import { IChapterView, ICourseDetailView, ILessonView } from "@/types/courses/Course";
import { courseDifficultyType, ResourceContentType, Role, StateType } from "@prisma/client";

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Updates an existing course based on the provided course Id, and upload the thumbnail if file has been uploaded
 * @param req
 * @param res
 * @returns
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { fields, files } = (await readFieldWithSingleFile(req)) as any;

    const body = JSON.parse(fields.course[0]);
    const name = createSlug(body.name);
    let courseId = Number(body.courseId);

    const existingCourse = await prisma.course.findUnique({
      where: {
        courseId: body.courseId,
      },
      select: {
        tvThumbnail: true,
        tvProviderId: true,
      },
    });

    if (existingCourse) {
      //need to update
      let trailerThumbnail = existingCourse.tvThumbnail;

      //first check if new thumbnail has been uploaded
      if (files.file && files.file.length > 0) {
        //Make sure the trailer video provider Id exists
        if (existingCourse.tvProviderId) {
          const cms = new ContentManagementService().getCMS(appConstant.defaultCMSProvider);
          const cmsConfig = (await cms.getCMSConfig()).body?.config;

          if (existingCourse.tvThumbnail) {
            //delete the existing thumbnail
            await cms.deleteCDNImage(cmsConfig, existingCourse.tvThumbnail);
          }

          const extension = getFileExtension(files.file[0].originalFilename);
          const sourcePath = path.resolve(files.file[0].filepath);
          const safeDir = path.resolve("/var/www/uploads"); // Replace with your safe directory
          if (!sourcePath.startsWith(safeDir)) {
            throw new Error("Invalid file path");
          }
          const fileBuffer = await fs.promises.readFile(sourcePath);
          //now upload the image
          const newThumbnailResponse = await cms.uploadVideoThumbnail(
            cmsConfig,
            fileBuffer,
            extension,
            existingCourse.tvProviderId,
            courseId,
            "course"
          );
          if (newThumbnailResponse.success && newThumbnailResponse.body) {
            trailerThumbnail = newThumbnailResponse.body;
          }
        } else {
          throw new Error("Unable to upload the thumnail, due to missing trailer video details");
        }
      }

      const updateDetails = await prisma.course.update({
        select: {
          courseId: true,
          name: true,
          description: true,
          expiryInDays: true,
          tvUrl: true,
          user: {
            select: {
              name: true,
              image: true,
            },
          },
          state: true,
          chapters: {
            select: {
              name: true,
              description: true,
              resource: {
                select: {
                  name: true,
                  description: true,
                  state: true,
                  video: {
                    select: {
                      videoDuration: true,
                      resourceId: true,
                    },
                  },
                  assignment: {
                    select: {
                      estimatedDuration: true,
                    },
                  },
                },
                where: {
                  state: StateType.ACTIVE,
                },
              },
            },
          },

          difficultyLevel: true,
          courseType: true,
          coursePrice: true,
        },
        where: {
          courseId: Number(courseId),
        },
        data: {
          ...body,
          tvThumbnail: trailerThumbnail,
          slug: name,
        },
      });

      let contentDurationInHrs = 0;
      let assignmentCount = 0;
      const lessons = updateDetails.chapters.flatMap((c) => c.resource);
      lessons.forEach((l) => {
        if (l.assignment && l.assignment.estimatedDuration) {
          assignmentCount++;
          contentDurationInHrs += Number((l.assignment.estimatedDuration / 60).toFixed(1));
        } else if (l.video && l.video.videoDuration) {
          contentDurationInHrs += Number((l.video.videoDuration / 3600).toFixed(1));
        }
      });

      let chapters: IChapterView[] = updateDetails.chapters.map((c) => {
        const lessons: ILessonView[] = c.resource.map((l) => {
          if (l.assignment && l.assignment.estimatedDuration) {
            return {
              name: l.name,
              description: l.description || "",
              state: l.state,
              lessonType: ResourceContentType.Assignment,
              durationInMins: l.assignment.estimatedDuration,
            };
          } else {
            return {
              name: l.name,
              description: l.description || "",
              state: l.state,
              lessonType: ResourceContentType.Assignment,
              durationInMins: Number((l?.video?.videoDuration || 0 / 60).toFixed(1)),
            };
          }
        });
        return {
          name: c.name,
          description: c.description || "",
          lessons: lessons,
        };
      });

      const courseDetailedView: ICourseDetailView = {
        name: updateDetails.name,
        id: updateDetails.courseId,
        description: updateDetails.description,
        role: Role.AUTHOR,
        enrolmentDate: null,
        state: updateDetails.state,
        expiryInDays: updateDetails.expiryInDays,
        difficultyLevel: updateDetails.difficultyLevel || courseDifficultyType.Beginner,
        chapters: chapters,
        trailerEmbedUrl: updateDetails.tvUrl || undefined,
        author: {
          name: updateDetails.user.name,
          imageUrl: updateDetails.user.image || null,
          designation: `Software engineer`,
        },
        pricing: {
          amount: updateDetails.coursePrice || 0,
          currency: appConstant.currency,
        },
        contentDurationInHrs: contentDurationInHrs,
        assignmentsCount: assignmentCount,
      };

      return res
        .status(200)
        .json(
          new APIResponse<ICourseDetailView>(true, 200, `Course has been successfully updated`, courseDetailedView)
        );
    } else {
      return res.status(404).json({ success: false, error: "Course not found" });
    }
  } catch (error) {
    return errorHandler(error, res);
  }
};

export default withMethods(["POST"], withUserAuthorized(handler));
