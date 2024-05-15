import prisma from "@/lib/prisma";
import { NextApiResponse, NextApiRequest } from "next";
import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { withMethods } from "@/lib/api-middlewares/with-method";
import { withAuthentication } from "@/lib/api-middlewares/with-authentication";
import { getToken } from "next-auth/jwt";
import { getCookieName } from "@/lib/utils";

import fs from "fs";

import { ContentManagementService } from "@/services/cms/ContentManagementService";
import { addNameAndCourse } from "@/lib/addCertificate";
import appConstant from "@/services/appConstant";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const cms = new ContentManagementService();

    let cookieName = getCookieName();

    const { courseId, certificateId } = req.query;
    const token = await getToken({
      req,
      secret: process.env.NEXT_PUBLIC_SECRET,
      cookieName,
    });

    const authorId = token?.id;

    const course = await prisma.course.findUnique({
      where: {
        courseId: Number(courseId),
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        chapters: {
          where: {
            courseId: Number(courseId),
          },
          include: {
            resource: {
              where: {
                state: "ACTIVE",
              },
              include: {
                video: {},
              },
            },
          },
        },
      },
    });

    const findExistingCertificate = await prisma.courseCertificates.findFirst({
      where: {
        studentId: String(token?.id),
        courseId: Number(courseId),
      },
    });

    const findProgress = await prisma.courseProgress.findMany({
      orderBy: [{ createdAt: "asc" }],

      where: {
        studentId: authorId,
        courseId: Number(courseId),
      },
    });

    if (findProgress.length > 0) {
      if (findExistingCertificate && findExistingCertificate.imagePath) {
        return res.status(200).json({
          info: false,
          success: true,
          message: "course successfully fetched",
          latestProgress: {
            nextChap: course?.chapters[0],
            nextLesson: course?.chapters[0].resource[0],
            completed: true,
            certificateIssueId: findExistingCertificate.id,
          },
          courseDetails: course,
        });
      } else if (!findExistingCertificate) {
        let lastIndex = findProgress.length > 0 ? findProgress.length - 1 : 0;

        const currentResource = await prisma.resource.findUnique({
          where: {
            resourceId: findProgress[lastIndex]?.resourceId,
          },
        });

        const currChapter = await prisma.chapter.findUnique({
          where: {
            chapterId: findProgress[lastIndex]?.chapterId,
          },
          include: {
            resource: {
              where: {
                state: "ACTIVE",
              },
              include: {
                video: {},
              },
            },
          },
        });
        let nextLesson;
        let nextChap;
        let completed;
        let certificateIssueId;
        if (currentResource && currChapter && currChapter?.resource.length > currentResource?.sequenceId) {
          nextChap = currChapter;
          nextLesson = currChapter.resource.find((r) => r.sequenceId === currentResource.sequenceId + 1);
          completed = false;
        }
        if (currentResource && currChapter && currChapter?.resource.length === currentResource?.sequenceId) {
          nextChap = course?.chapters.find((chapter) => chapter.sequenceId === currChapter.sequenceId + 1);
          nextLesson = nextChap?.resource[0];
          completed = false;
        }

        if (
          course?.chapters.length === currChapter?.sequenceId &&
          currChapter?.resource.length === currentResource?.sequenceId
        ) {
          completed = true;
          if (!findExistingCertificate && certificateId) {
            const createCertificate = await prisma.courseCertificates.create({
              data: {
                courseId: Number(courseId),
                studentId: String(token?.id),
              },
            });

            certificateIssueId = createCertificate.id;
            let description = `who has successfully completed the course ${course?.name}, an online course   authored by ${course?.user.name} and offered by Torqbit`;

            const updatedImg =
              token?.name &&
              (await addNameAndCourse(
                description,
                token?.name,
                course?.user.name as string,
                certificateIssueId,
                String(certificateId)
              ));

            const serviceProviderResponse = await prisma?.serviceProvider.findFirst({
              where: {
                service_type: "media",
              },
            });
            if (serviceProviderResponse) {
              const serviceProvider = cms.getServiceProvider(
                serviceProviderResponse?.provider_name,
                serviceProviderResponse?.providerDetail
              );

              const fileBuffer = fs.readFileSync(updatedImg as string);
              let fullName = `${certificateIssueId}.png`;
              const bannerPath = `${appConstant.certificateDirectory}${fullName}`;
              const uploadResponse = await cms.uploadFile(fullName, fileBuffer, bannerPath, serviceProvider);
              if (updatedImg) {
                fs.unlinkSync(updatedImg);
              }

              const updateCourseCertificate = await prisma.courseCertificates.updateMany({
                where: {
                  studentId: token?.id,
                  courseId: Number(courseId),
                },
                data: {
                  imagePath: uploadResponse.fileCDNPath,
                },
              });

              nextChap = course?.chapters[0];
              nextLesson = nextChap?.resource[0];
              completed = true;

              return res.status(uploadResponse?.statusCode || 200).json({
                courseDetails: course,
                latestProgress: {
                  nextChap: nextChap,
                  nextLesson: nextLesson,
                  completed: true,
                  certificateIssueId: certificateIssueId,
                },
              });
            } else {
              throw new Error("No Media Provder has been configured");
            }
          } else {
            let progressData = {
              nextChap: nextChap,
              nextLesson: nextLesson,
              completed: true,
            };

            return res.status(200).json({
              info: false,
              success: true,
              message: "course successfully fetched",
              courseDetails: course,

              latestProgress: progressData,
            });
          }
        }

        return res.status(200).json({
          courseDetails: course,
          latestProgress: {
            nextChap: nextChap,
            nextLesson: nextLesson,
            completed: false,
            certificateIssueId: certificateIssueId,
          },
        });
      }
    } else {
      return res.status(200).json({
        info: false,
        success: true,
        message: "course successfully fetched ",
        latestProgress: {
          nextChap: course?.chapters[0],
          nextLesson: course?.chapters[0].resource[0],
        },
        courseDetails: course,
      });
    }
  } catch (error) {
    return errorHandler(error, res);
  }
};

export default withMethods(["GET"], withAuthentication(handler));
