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


export enum AssignmentType {
  PROGRAMMING_LANG = "PROGRAMMING_LANG",
  PROGRAMMING_PROJECT = "PROGRAMMING_PROJECT",
  MCQ = "MCQ",
  SUBJECTIVE = "SUBJECTIVE",
}

export enum ProjectFramework {
  STATIC_WEB = "STATIC_WEB",
  REACTJS = "REACTJS",
  NEXT_APP = "NEXT_APP",
}

export type DocumentExtension = "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "txt" | "rtf" | "odt";

export interface IAssignmentDetails {
  _type: AssignmentType;
}
export interface IProgrammingLangSubmission extends IAssignmentDetails {
  instructions: string;
  initialCode: string;
  programmingLang: string;
  grading: {
    maxScore: number;
    gradingParameters: Array<{ parameter: string, maxScore: number }>
  }
}

export interface IProgrammingProjectSubmission extends IAssignmentDetails {
  framework: ProjectFramework;
  version: string;
  baseProjectArchiveUrl: string;
  grading: {
    maxScore: number;
    gradingParameters: Array<{ parameter: string, maxScore: number }>
  }
}

export interface MultipleChoiceQA {
  title: string;
  description?: string
  options: string[];
  correctOptionIndex: number[];
  maxScore: number;
  answerExplaination: string;
}
export interface MCQAssignment extends IAssignmentDetails {
  questions: MultipleChoiceQA[];
}

export interface SubjectiveAssignment extends IAssignmentDetails {
  title: string;
  description: string;
  allowFileUpload: boolean;
  supportFileTypes: string[];
}


export interface AssignmentCreateRequest {
  lessonId: number;
  assingmentType: AssignmentType;
  estimatedDurationInMins: number;
  maximumScore: number;
  passingScore: number
  details: IAssignmentDetails;
}
