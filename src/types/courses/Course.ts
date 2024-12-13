import { IResourceDetail } from "@/lib/types/learn";
import {
  $Enums,
  Chapter,
  CourseState,
  CourseType,
  Resource,
  ResourceContentType,
  Role,
  StateType,
  SubmissionType,
  Video,
  VideoState,
  courseDifficultyType,
} from "@prisma/client";
import { IProgrammingSubmissionContent, ITextSubmissionContent, IUrlSubmission } from "./assignment";

export interface IHeroCoursePreview {
  courseName: string;
  authorImage: string;
  authorName: string;
  courseTrailer: string;
}

export interface ChapterDetail {
  sequenceId: number;
  chapterId: number;
  courseId: number;
  createdAt: string;
  state: string;
  description: string;
  isActive: boolean;
  name: string;
  resource: IResourceDetail[];
}

export interface IAssignmentDetail {
  assignmentId: number;
  content: ITextSubmissionContent | IProgrammingSubmissionContent | IUrlSubmission | string;
  assignmentFiles: string[];
  submissionType: SubmissionType;
  name?: string;
  estimatedDuration: number;
}
export interface VideoLesson {
  videoId: number;
  lessonId: number;
  videoUrl: string;
  videoDuration: number;
  description: string;
  isWatched: boolean;
  title: string;
  contentType?: ResourceContentType;
  estimatedDuration?: number;
}
export interface CourseLessons {
  chapterSeq: number;
  chapterName: string;
  lessons: Array<VideoLesson>;
}
export interface ICertificateReponse {
  info: boolean;
  success: boolean;
  message: string;
  certificateIssueId: string;
}

export interface ICertificateInfo {
  studentId: string;
  courseId: number;
  authorName: string;
  courseName: string;
  studentEmail: string;
  studentName: string;
  certificateTemplate: string;
}

export interface StaticVideoLesson {
  lessonId: number;
  videoDuration: number;
  isWatched: boolean;
  title: string;
  contentType: ResourceContentType;
}

interface StaticCourseLessons {
  chapterSeq: number;
  chapterName: string;
  lessons: Array<StaticVideoLesson>;
}

export interface ICoursePreviewDetail {
  chapterSeq?: number;
  resourceSeq?: number;
  resourceId?: number;
  lessonName?: string;
  courseName?: string;
  description?: string;
  tvUrl?: string;
  previewMode?: boolean;
  courseType?: CourseType;
  coursePrice?: number;
  videoUrl?: string;
  contentType?: ResourceContentType;
  videoId?: number;
  videoDuration?: number;
  chaterId?: number;
  chapterName?: string;
  watchedRes?: number;
  courseState: StateType;
  thumbnail?: string;
  difficultyLevel?: courseDifficultyType;
  authorImage?: string;
  authorName?: string;
  userStatus: CourseState;
  estimatedDuration: number;
  videoThumbnail: string;
  progress?: number;
}

export interface ICoursePriviewInfo {
  name: string;
  description: string;
  courseTrailer: string;
  previewMode: boolean;
  courseType: CourseType;
  coursePrice: number;
  userRole: Role;
  progress: number;
  totalWatched: number;
  courseState: $Enums.StateType;
  thumbnail: string;
  difficultyLevel: $Enums.courseDifficultyType;
  authorImage: string;
  authorName: string;
  userStatus: CourseState;
}

export interface CourseLessonAPIResponse {
  success: boolean;
  statusCode: number;
  message: string;
  course: ICoursePriviewInfo;
  lessons: CourseLessons[];
}
export interface CourseAPIResponse {
  success: boolean;
  statusCode: number;
  message: string;
  courseDetails: CourseInfo;
}
export interface CourseData {
  name: string;
  description: string;
  expiryInDays: number;
  state?: string;
  chapters: ChapterDetail[];
  difficultyLevel?: courseDifficultyType;
  certificateTemplate?: string;
  courseType?: string;
  coursePrice?: number;
  thumbnail?: string;
}
export interface CourseInfo {
  about: string;
  previewMode: boolean;
  user: {
    name: string;
  };
  authorId: string;
  sequenceId: number;
  skills: string[];
  tvThumbnail: string;
  tvProviderId: string;
  tvState: VideoState;
  tvUrl: string;
  thumbnail: string;
  videoUrl: string;
  chapters: ChapterDetail[];
  courseId: number;
  coursePrice: number;
  courseType: string;
  createdAt: string;
  description: string;
  expiryInDays: number;
  durationInMonths: number;
  difficultyLevel: courseDifficultyType;
  certificateTemplate: string;
  name: string;
  programId: number;
  state: string;
  tags: string[];
}

export interface IVideoLesson {
  title: string;
  description: string;
  chapterId?: number;
  video?: Video;
}

export interface BasicAPIResponse {
  success: boolean;
  statusCode: number;
  message: string;
}

export interface VideoInfo {
  videoId: string;
  thumbnail: string;
  previewUrl: string;
  mediaProviderName: string;
  videoDuration: number;
  state: VideoState;
  videoUrl: string;
  id?: number;
}

export interface VideoAPIResponse {
  success: boolean;
  statusCode: number;
  message: string;
  video: VideoInfo;
}

export interface FileUploadResponse {
  success: boolean;
  statusCode: number;
  message: string;
  fileCDNPath: string;
  videoState?: VideoState;
}

export type UploadVideoObjectType = "lesson" | "course";

export interface UploadedResourceDetail {
  fileName?: string;
  videoUrl?: string;
  videoId?: string;
  thumbnail?: string;
  state?: string;
  mediaProvider?: string;
  videoDuration?: number;
}

interface IResource extends Resource {
  video: { videoDuration: number };
}

interface IChapter extends Chapter {
  resource: IResource[];
}

export interface IStaticCourseTemplate {
  authorImage: string;
  authorName: string;
  coursePrice: number;
  description: string;
  difficultyLevel: string;
  name: string;
  thumbnail: string;
  chapters: StaticCourseLessons[];
}

export interface ICoursePageDetail {
  courseId: number;
  state: StateType;
  name: string;
  description: string;
  thumbnail: string;
  difficultyLevel: string;
  tvUrl: string;
  userRole: Role;
  coursePrice: number;
  courseType: CourseType;
  chapters: CourseLessons[];
  progress: number;
  userStatus: CourseState;
  authorName?: string;
  authorImage?: string;
  previewMode: boolean;
  videoThumbnail: string;
}

export interface ILessonPreviewDetail {
  chapterSeq?: number;
  resourceSeq?: number;
  resourceId?: number;
  lessonName?: string;
  courseName?: string;
  description?: string;
  previewMode?: number;
  lessonDescription?: string;
  videoId?: string;
  videoUrl?: string;
  videoDuration?: number;
  chapterId?: number;
  contentType?: ResourceContentType;
  chapterName?: string;
  watchedRes?: number;
  estimatedDuration: number;
}

export type IContentTabType = "COURSES" | "BLOGS" | "UPDATES" | "SUBMISSIONS" | "EVENTS";
