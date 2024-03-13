export interface Chapter {
  chapterId: number;
  courseId: number;
  createdAt: Date;
  description: string;
  isActive: boolean;
  name: string;

  sequenceId: number;
}

export interface Course {
  courseId: number;
  description: string;
  about: string;
  state: string;
  authorId: number;
  durationInMonths: number;
  id: number;
  programId: number;
  tags: string[];
  name: string;
  sequenceId: number;
}

export interface ICourse extends Course {
  chapter: IChapter[];
}

export interface IChapter extends Chapter {
  resource: [
    {
      isActive: boolean;
      chapterId: number;
      resourceId: number;
      name: string;
      description: string;
      contentType: string;
      videoDuration: number;
      videoUrl: string;
      thumbnail: string;
      submitDay: number;
      languages: string[];
      sequenceId: number;
    }
  ];
}

export interface IResource {
  resourceId: number;
  name: string;
  description: string;

  videoDuration: number;
  thumbnail: string;
  submitDay: number;
  languages: string[];

  chapterId: number;
  sequenceId: number;
  content?: string | null;
  assignment?: any;
  contentType: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  daysToSubmit?: number | null;
  isStarted?: boolean;
  assignmentLang?: string[];
}

export interface IProgram {
  id: number;
  thumbnail: string;
  durationInMonths: number;
  aboutProgram: string;
  description: string;
  title: string;
  authorId: number;
  banner: string;
  programType: string;
  course: [
    {
      courseId: number;
      description: string;
      about: string;
      state: string;
      authorId: number;
      durationInMonths: number;
      id: number;
      programId: number;
      tags: string[];
      name: string;
      sequenceId: number;

      chapter: [
        {
          chapterId: number;
          courseId: number;
          createdAt: Date;
          description: string;
          isActive: boolean;
          name: string;
          sequenceId: number;

          resource: [
            {
              isActive: boolean;
              chapterId: number;
              resourceId: number;
              name: string;
              description: string;
              contentType: string;
              videoDuration: number;
              videoUrl: string;
              thumbnail: string;
              submitDay: number;
              languages: string[];
              sequenceId: number;
            }
          ];
        }
      ];
    }
  ];
}