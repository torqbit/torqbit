import { IEmailCredentials } from "@/types/cms/email";

export interface IWelcomeEmailConfig {
  name: string;
  url: string;
  email: string;
}

export interface IEnrolmentEmailConfig {
  name: string;
  url: string;
  email: string;
  pdfPath?: string;
  course: { name: string; thumbnail: string };
}

export interface IEventEmailConfig {
  name: string;
  email: string;
  pdfPath: string;
  eventName: string;
  slug: string;
}

export interface ICompletionEmailConfig {
  name: string;
  url: string;
  email: string;

  courseName: string;
}

export interface IAssignmentCompletionConfig {
  name: string;
  url: string;
  submissionDate: string;
  email: string;
  assignmentName: string;
  score: number;
}

export interface IAssignmentSubmissionConfig {
  studentName: string;
  url: string;
  submissionDate: string;
  authorEmail: string;
  authorName: string;
  assignmentName: string;
  submissionCount: number;
}

export interface IAssignmentCompletionConfig {
  name: string;
  url: string;
  submissionDate: string;
  email: string;
  assignmentName: string;
  score: number;
}

export interface INewLessonConfig {
  name: string;
  courseName: string;
  url: string;
  email: string;
  lessonName: string;
  lessonDesription: string;
  thumbnail: string;
}

export interface IEventAccessMailConfig {
  name: string;
  eventName: string;
  url: string;
  email: string;
  instructions: string;
  startTime: Date;
  thumbnail: string;
  location: string;
  loactionUrl: string;
}

export interface IEventAccessDeniedMailConfig {
  name: string;
  eventName: string;
  email: string;
  reason: string;
}
export interface IFeedBackConfig {
  feedback: string;
  name: string;
  email: string;
}
export interface ITestEmailConfig {
  name: string;
  email: string;
  credendials: IEmailCredentials;
}
export interface IEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}
