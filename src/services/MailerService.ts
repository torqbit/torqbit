import { IEmailEventType } from "@/lib/types/email";
import { render } from "@react-email/render";
import WelcomeEmailPage from "@/components/Email/WelcomeEmail";
import nodemailer from "nodemailer";
import { CourseEnrolmentEmail } from "@/components/Email/CourseRegistrationEmail";
import CourseCompletionEmail from "@/components/Email/CourseCompletionEmail";
import {
  IAssignmentCompletionConfig,
  IAssignmentSubmissionConfig,
  ICompletionEmailConfig,
  IEmailResponse,
  IEnrolmentEmailConfig,
  IEventAccessDeniedMailConfig,
  IEventAccessMailConfig,
  IEventEmailConfig,
  IFeedBackConfig,
  INewLessonConfig,
  ITestEmailConfig,
  IWelcomeEmailConfig,
} from "@/lib/emailConfig";
import AssignmentCompletionEmail from "@/components/Email/AssignmentCompletionEmail";
import NewLessonEmail from "@/components/Email/NewLessonEmail";
import AssignmentSubmissionEmail from "@/components/Email/AssignmentSubmissionEmail";

import EventCompletionEmail from "@/components/Email/EventCompletionEmail";
import EventAccessEmail from "@/components/Email/EventAccessEmail";
import EventAccessDeniedEmail from "@/components/Email/EventAccessDeniedEmail";
import TestEmailCredentialsEmail from "@/components/Email/TestEmailCredentialsEmail";
export const getEmailErrorMessage = (response: string, message?: string) => {
  let errResponse;
  if (response === "CONN") {
    errResponse = "Connection failed";
  } else if (response === "AUTH PLAIN") {
    errResponse = " Authentication failed";
  } else if (response === "ECONNECTION") {
    errResponse = "Connection failed";
  } else if (response === "DATA") {
    errResponse = message;
  } else {
    errResponse = response;
  }
  return errResponse;
};

class MailerService {
  transporter: any;
  constructor() {
    this.transporter = nodemailer.createTransport({
      port: 587,
      host: process.env.NEXT_SMTP_HOST,
      secure: false,
      auth: {
        user: process.env.NEXT_SMTP_USER,
        pass: process.env.NEXT_SMTP_PASSWORD,
      },
      from: `${process.env.FROM_SMTP_USER_EMAIL}`,
    });
  }
  sendMail = (eventType: IEmailEventType, config: any) => {
    switch (eventType) {
      case "NEW_USER":
        return this.sendWelcomeMail(config as IWelcomeEmailConfig);
      case "COURSE_ENROLMENT":
        return this.sendEnrolmentMail(config as IEnrolmentEmailConfig);
      case "COURSE_COMPLETION":
        return this.sendCompletionMail(config as ICompletionEmailConfig);
      case "FEEDBACK":
        return this.sendFeedBackMail(config as IFeedBackConfig);
      case "ASSIGNMENT_COMPLETION":
        return this.sendAssignmentCompletionMail(config as IAssignmentCompletionConfig);
      case "NEW_LESSON":
        return this.sendNewLessonMail(config as INewLessonConfig);
      case "ASSIGNMENT_SUBMISSION":
        return this.sendNewLessonMail(config as INewLessonConfig);
      case "EVENT_COMPLETION":
        return this.sendEventCompletion(config as IEventEmailConfig);
      case "GRANT_ACCESS":
        return this.sendEventAccessMail(config as IEventAccessMailConfig);
      case "DENIED_ACCESS":
        return this.sendEventAccessDeniedMail(config as IEventAccessDeniedMailConfig);
      case "TEST_EMAIL_CREDENIDTIALS":
        return this.sendEmailCredentialsTestMail(config as ITestEmailConfig);

      default:
        throw new Error("something went wrong");
    }
  };

  // multipe mails
  sendMultipleMails = async (eventType: IEmailEventType, detail: INewLessonConfig[], onComplete: () => void) => {
    Promise.all(
      detail.map((config, i) => {
        setTimeout(async () => {
          await this.sendMail(eventType, config).then((result) => {
            console.log(result.error);
          });
        }, i * 1000);
      })
    )
      .then(async (result) => {
        onComplete();
      })
      .catch((error) => {
        console.log("error on multiple email send:", error);
      });
  };

  async sendWelcomeMail(config: IWelcomeEmailConfig): Promise<IEmailResponse> {
    try {
      const htmlString = render(WelcomeEmailPage({ configData: config }));
      const sendMail = await this.transporter.sendMail({
        to: config.email,
        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${process.env.FROM_SMTP_USER_EMAIL}>`,
        subject: `Welcome to ${process.env.NEXT_PUBLIC_PLATFORM_NAME}: Ignite Your Learning Journey!`,
        html: htmlString,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command)}` };
    }
  }

  async sendEnrolmentMail(config: IEnrolmentEmailConfig) {
    try {
      const htmlString = render(CourseEnrolmentEmail({ configData: config }));
      const mailConfig = {
        to: config.email,
        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${process.env.FROM_SMTP_USER_EMAIL}>`,
        subject: `Get Started: ${config.course.name}`,
        html: htmlString,
      };
      if (config.pdfPath) {
        Object.assign(mailConfig, {
          attachments: [
            {
              filename: "invoice.pdf",
              path: config.pdfPath,
              contentType: "application/pdf",
            },
          ],
        });
      }
      const sendMail = await this.transporter.sendMail(mailConfig);

      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      console.error(error, "enrolment email sending error");
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command)}` };
    }
  }

  async sendCompletionMail(config: ICompletionEmailConfig) {
    try {
      const htmlString = render(
        CourseCompletionEmail({
          configData: config,
        })
      );

      const sendMail = await this.transporter.sendMail({
        to: config.email,
        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${process.env.FROM_SMTP_USER_EMAIL}>`,
        subject: `Congratulations on Completing ${config.courseName}`,
        html: htmlString,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command)}` };
    }
  }

  async sendAssignmentCompletionMail(config: IAssignmentCompletionConfig) {
    try {
      const htmlString = render(
        AssignmentCompletionEmail({
          configData: config,
        })
      );

      const sendMail = await this.transporter.sendMail({
        to: config.email,
        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${process.env.FROM_SMTP_USER_EMAIL}>`,
        subject: `Assignment - ${config.assignmentName} has been evaluated`,
        html: htmlString,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command)}` };
    }
  }

  async sendNewLessonMail(config: INewLessonConfig) {
    try {
      const htmlString = render(
        NewLessonEmail({
          configData: config,
        })
      );

      const sendMail = await this.transporter.sendMail({
        to: config.email,
        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${process.env.FROM_SMTP_USER_EMAIL}>`,
        subject: `New video lesson published in course `,
        html: htmlString,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command)}` };
    }
  }

  async sendAssigmentSubmissionMail(config: IAssignmentSubmissionConfig) {
    try {
      const htmlString = render(
        AssignmentSubmissionEmail({
          configData: config,
        })
      );

      const sendMail = await this.transporter.sendMail({
        to: config.authorEmail,
        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${process.env.FROM_SMTP_USER_EMAIL}>`,
        subject: `Assignment - ${config.assignmentName} has been submitted `,
        html: htmlString,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command)}` };
    }
  }

  async sendFeedBackMail(config: IFeedBackConfig) {
    try {
      const sendMail = await this.transporter.sendMail({
        to: process.env.FROM_SMTP_SUPPORT_EMAIL,

        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${process.env.FROM_SMTP_USER_EMAIL}>`,
        subject: `Feedback received from ${config.email} `,
        text: `Hey there, \n \n We have received a feedback from ${config.name} \n \n ${config.feedback}`,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command)}` };
    }
  }

  async sendEventCompletion(config: IEventEmailConfig) {
    try {
      const htmlString = render(EventCompletionEmail({ configData: config }));
      const mailConfig = {
        to: config.email,
        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${process.env.FROM_SMTP_USER_EMAIL}>`,
        subject: `Certificate of Participation for ${config.eventName}`,
        html: htmlString,
      };
      if (config.pdfPath !== "null") {
        Object.assign(mailConfig, {
          attachments: [
            {
              filename: `certificate-${config.slug}.pdf`,
              path: config.pdfPath,
              contentType: "application/pdf",
            },
          ],
        });
      }
      const sendMail = await this.transporter.sendMail(mailConfig);

      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command)}` };
    }
  }

  async sendEventAccessMail(config: IEventAccessMailConfig) {
    try {
      const htmlString = render(
        EventAccessEmail({
          configData: config,
        })
      );

      const sendMail = await this.transporter.sendMail({
        to: config.email,
        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${process.env.FROM_SMTP_USER_EMAIL}>`,
        subject: `Booking request has been confirmed for event - ${config.eventName} `,
        html: htmlString,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command)}` };
    }
  }
  async sendEventAccessDeniedMail(config: IEventAccessDeniedMailConfig) {
    try {
      const htmlString = render(
        EventAccessDeniedEmail({
          configData: config,
        })
      );

      const sendMail = await this.transporter.sendMail({
        to: config.email,
        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${process.env.FROM_SMTP_USER_EMAIL}>`,
        subject: `Booking request has been denied for event - ${config.eventName} `,

        html: htmlString,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command)}` };
    }
  }

  async sendEmailCredentialsTestMail(config: ITestEmailConfig) {
    const testTransporter = nodemailer.createTransport({
      port: 587,
      host: config.credendials.smtpHost,
      secure: false,
      auth: {
        user: config.credendials.smtpUser,
        pass: config.credendials.smtpPassword,
      },
      from: `${config.credendials.smtpFromEmail}`,
    });
    try {
      const htmlString = render(
        TestEmailCredentialsEmail({
          configData: config,
        })
      );

      const sendMail = await testTransporter.sendMail({
        to: config.email,
        from: `${process.env.NEXT_PUBLIC_PLATFORM_NAME} <${config.credendials.smtpFromEmail}>`,
        subject: `Test Email Credentials `,
        html: htmlString,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      console.log("error ", error);
      return { success: false, error: `Error sending email:${getEmailErrorMessage(error.command, error.response)}` };
    }
  }
}

export default new MailerService();
