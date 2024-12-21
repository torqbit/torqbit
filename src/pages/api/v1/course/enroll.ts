import prisma from "@/lib/prisma";
import { NextApiResponse, NextApiRequest } from "next";
import withValidation from "@/lib/api-middlewares/with-validation";
import { withAuthentication } from "@/lib/api-middlewares/with-authentication";
import { withMethods } from "@/lib/api-middlewares/with-method";
import * as z from "zod";
import { errorHandler } from "@/lib/api-middlewares/errorHandler";
import { getToken } from "next-auth/jwt";
import { addDays, getCookieName } from "@/lib/utils";
import MailerService from "@/services/MailerService";
import { CourseState, CourseType, orderStatus } from "@prisma/client";
import { PaymentManagemetService } from "@/services/payment/PaymentManagementService";
import { CashFreeConfig, CoursePaymentConfig, UserConfig } from "@/types/payment";

export const validateReqBody = z.object({
  courseId: z.number(),
  orderId: z.string().optional(),
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    let cookieName = getCookieName();

    const token = await getToken({
      req,
      secret: process.env.NEXT_PUBLIC_SECRET,
      cookieName,
    });

    const body = await req.body;

    const { courseId, orderId } = body;

    // check is user Active

    if (!token || !token.isActive) {
      return res.status(400).json({
        success: false,
        error: " You don't have an active user",
      });
    }

    // check user already enrolled

    const alreadyEnrolled =
      orderId &&
      (await prisma.courseRegistration.findUnique({
        where: {
          orderId,
        },
        select: {
          registrationId: true,
        },
      }));

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        alreadyEnrolled: true,
        error: "You have already enrolled in this course",
      });
    }

    const course = await prisma.course.findUnique({
      where: {
        courseId: courseId,
      },
      select: {
        courseType: true,
        thumbnail: true,
        name: true,
        slug: true,
        expiryInDays: true,
        coursePrice: true,
      },
    });
    let courseType = course?.courseType;

    if (course) {
      const expiryDate = addDays(Number(course.expiryInDays));
      // IF COURSE IS FREE

      if (courseType === CourseType.FREE) {
        await prisma.$transaction(async (tx) => {
          const createOrder = await tx.order.create({
            data: {
              studentId: token.id,
              orderStatus: orderStatus.SUCCESS,
              productId: courseId,
              amount: 0,
            },
          });

          await prisma.courseRegistration.create({
            data: {
              studentId: token.id,
              expireIn: expiryDate,
              orderId: createOrder.id,
              courseState: CourseState.ENROLLED,
            },
          });
        });

        const configData = {
          name: token.name,
          email: token.email,

          url: `${process.env.NEXTAUTH_URL}/courses/${course.slug}`,
          course: {
            name: course.name,
            thumbnail: course.thumbnail,
          },
        };

        MailerService.sendMail("COURSE_ENROLMENT", configData).then((result) => {
          console.log(result.error);
        });

        return res.status(200).json({
          success: true,
          message: "Congratulations! You’ve successfully enrolled in this course.",
        });
      }

      // IF COURSE IS PAID

      if (courseType === CourseType.PAID) {
        if (!token.phone) {
          return res.status(400).json({ success: false, error: "Missing phone number", phoneNotFound: true });
        } else if (token.phone.length > 10 || token.phone.length < 10) {
          return res
            .status(400)
            .json({ success: false, error: "Phone number must be of 10 digits !", phoneNotFound: true });
        } else {
          const userConfig: UserConfig = {
            studentId: String(token.id),
            email: String(token.email),
            studentName: String(token.name),
            phone: token.phone,
          };

          const courseConfig: CoursePaymentConfig = {
            courseId: Number(courseId),
            slug: String(course.slug),
            amount: Number(course.coursePrice),
            coursePrice: Number(course.coursePrice),
          };

          const gatewayConfig: CashFreeConfig = {
            name: String(process.env.GATEWAY_PROVIDER_NAME),
            clientId: String(process.env.CASHFREE_CLIENT_ID),
            secretId: String(process.env.CASHFREE_SECRET_KEY),
          };
          const pms = new PaymentManagemetService();

          const paymentData = await pms.processPayment(userConfig, courseConfig, gatewayConfig);

          if (paymentData.success) {
            return res.status(paymentData.status).json({ ...paymentData.body, success: paymentData.success });
          } else {
            return res.status(paymentData.status).json({ success: paymentData.success, error: paymentData.message });
          }
        }
      }
    }
  } catch (error: any) {
    return errorHandler(error, res);
  }
};

export default withMethods(["POST"], withValidation(validateReqBody, withAuthentication(handler)));
