import prisma from "@/lib/prisma";
import { CeritificateService } from "@/services/certificate/CertificateService";
import { ICertificateInfo } from "@/types/courses/Course";
import { ResourceContentType, StateType } from "@prisma/client";

const updateCourseProgress = async (
  courseId: number,
  lessonId: number,
  studentId: string,
  contentType: ResourceContentType,
  totalLessons?: number,
  totalWatched?: number
): Promise<{ lessonsCompleted: number; totalLessons: number }> => {
  return new Promise(async (resolve, reject) => {
    const checkProgress = await prisma.courseProgress.findUnique({
      where: {
        studentId_resourceId: {
          studentId: studentId,
          resourceId: lessonId,
        },
      },
    });

    if (checkProgress) {
      resolve({ lessonsCompleted: Number(totalWatched), totalLessons: Number(totalLessons) });
    }

    const updateProgress = await prisma?.courseProgress.create({
      data: {
        courseId: courseId,
        resourceId: lessonId,
        studentId: studentId,
      },
      select: {
        course: {
          select: {
            previewMode: true,
          },
        },
      },
    });

    if (updateProgress) {
      const courseProgress = await prisma.$queryRaw<
        any[]
      >`select COUNT(re.resourceId) as lessons, COUNT(cp.resourceId) as watched_lessons FROM Course as co
      INNER JOIN Chapter as ch ON co.courseId = ch.courseId 
      INNER JOIN CourseRegistration as cr ON co.courseId = cr.courseId
      INNER JOIN Resource as re ON ch.chapterId = re.chapterId
      LEFT OUTER JOIN CourseProgress as cp ON re.resourceId = cp.resourceId AND cr.studentId = cp.studentId
      WHERE co.courseId = ${Number(courseId)} AND re.state = ${StateType.ACTIVE} AND cr.studentId = ${studentId} 
      `;

      if (courseProgress.length > 0) {
        const lessonsDetail = {
          lessonsCompleted: Number(courseProgress[0].watched_lessons),
          totalLessons: Number(courseProgress[0].lessons),
        };

        if (contentType === ResourceContentType.Video) {
          resolve(lessonsDetail);
        }

        if (
          lessonsDetail.lessonsCompleted === lessonsDetail.totalLessons &&
          !updateProgress.course.previewMode &&
          contentType === ResourceContentType.Assignment
        ) {
          const courseDetail = await prisma.course.findUnique({
            where: {
              courseId: courseId,
            },
            select: {
              certificateTemplate: true,
              name: true,
              slug: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          });

          const studentDetail = await prisma.user.findUnique({
            where: {
              id: studentId,
            },
            select: {
              email: true,
              name: true,
            },
          });

          let certificateInfo: ICertificateInfo = {
            studentEmail: String(studentDetail?.email),
            studentId: studentId,
            courseName: String(courseDetail?.name),
            slug: String(courseDetail?.slug),
            studentName: String(studentDetail?.name),
            courseId: courseId,
            certificateTemplate: String(courseDetail?.certificateTemplate),
            authorName: String(courseDetail?.user.name),
          };

          await new CeritificateService().courseCertificate(certificateInfo);

          resolve({ lessonsCompleted: courseProgress[0].watched_lessons, totalLessons: courseProgress[0].lessons });
        } else {
          resolve({ lessonsCompleted: courseProgress[0].watched_lessons, totalLessons: courseProgress[0].lessons });
        }
      }
    }
  });
};

export default updateCourseProgress;
