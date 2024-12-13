export interface IAssignmentData {
  open: boolean;
  assignmentId?: number;
  lessonId?: number;
}

export interface ITreeConfig {
  htmlFiles: string[];
  cssFiles: string[];
}

export interface AssignmentConfig {
  codeData: string[][];
  courseId: number;
  lessonId: number;
  userId: string;
  previewFileName: string;
}

export interface ISubmissionContent {
  _type: string;
}

export interface IProgrammingSubmissionContent extends ISubmissionContent {
  [key: string]: string;
}

export interface ITextSubmissionContent extends ISubmissionContent {
  text: string;
}
export interface IUrlSubmission extends ISubmissionContent {
  url: string;
  service: string;
}

export type ISubmissionTypeContent = IProgrammingSubmissionContent | ITextSubmissionContent | IUrlSubmission | string;
