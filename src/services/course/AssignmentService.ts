import { Assignment, AssignmentSubmission, submissionStatus } from "@prisma/client";
import { getDelete, getFetch, postFetch } from "../request";
import { IAssignmentDetail } from "@/types/courses/Course";
import { IAssignmentDetails } from "@/types/courses/assignment";

export interface ISubmissionTableInfo {
  key: number;
  courseName: string;
  assignmentName: string;
  student: string;
  submissionDate: string;
}

export interface ISubmissionList {
  subId: number;
  studentId: string;
  submissionDate: string; // ISO 8601 date-time format
  assignmentId: number;
  courseId: number;
  courseName: string;
  assignmentName: string;
  studentName: string;
  isEvaluated: boolean;
}
export interface ISubmissionDetail {
  content: Map<string, string> | [string, string][];
  assignmentFiles: string[];
  assignmentId: number;
  isEvaluated: boolean;
  score?: number;
  comment?: string;
  lessonId: number;
  assignmentName: string;
}
export interface IAllSubmmissionsDetail {
  submissionId: number;

  content: Map<string, string> | [string, string][];
  comment: string;
  submittedDate: Date;
  evaluated: boolean;
  score: number | undefined;
}
export interface ILatestSubmissoinDetail {
  allSubmmissions: IAllSubmmissionsDetail[];
  isEvaluated: boolean;
  previousContent?: Map<string, string> | [string, string][];
  savedContent?: Map<string, string> | [string, string][];
  score: number;
  status?: submissionStatus;
  submitLimit?: number;
}

interface ApiResponse {
  success: boolean;
  error: string;
  message: string;
  preview: string;
  assignmentDetail: IAssignmentDetail;
  allAssignmentData: Assignment[];
  codeDetail: Map<string, string>;
  totalSubmissions: number;
  submissionList: SubmissionsByCourseId;
  submissionDetail: ISubmissionDetail;
  isEvaluated: boolean;
  latestSubmissionDetail: ILatestSubmissoinDetail;
  courseCompleted: boolean;
  courseId: number;
  allSubmmissions: IAllSubmmissionsDetail[];
  latestSubmissionStatus: submissionStatus;
  score: number;
  submitLimit: number;
}

export interface SubmissionsByCourseId {
  [courseId: number]: ISubmissionList[];
}

type FailedApiResponse = {
  error: string;
};
class AssignmentSerivce {
  updateAssignment = (
    assignmentData: {
      lessonId: number;
      content?: string;
      title?: string;
      assignmentFiles?: string[];
    },
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(assignmentData, `/api/v1/resource/assignment/update`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  createAssignment = (
    assignmentData: {
      lessonId: number;
      content?: string;
      title?: string;
      assignmentFiles?: string[];
      submissionConfig: IAssignmentDetails;
      isEdit: boolean;
      estimatedDuration: number;
    },
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(assignmentData, `/api/v1/resource/assignment/${assignmentData.isEdit ? "update" : "save"}`).then(
      (result) => {
        if (result.status == 200) {
          result.json().then((r) => {
            const apiResponse = r as ApiResponse;
            onSuccess(apiResponse);
          });
        } else {
          result.json().then((r) => {
            const failedResponse = r as FailedApiResponse;
            onFailure(failedResponse.error);
          });
        }
      }
    );
  };
  getAssignment = (
    lessonId: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getFetch(`/api/v1/resource/assignment/get?lessonId=${lessonId}`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  getSubmissionHistory = (
    lessonId: number,
    assignmentId: number,
    courseId: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getFetch(`/api/v1/course/${courseId}/assignment/${assignmentId}/${lessonId}/submission/history`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  getLatestSubmissionStatus = (
    lessonId: number,
    assignmentId: number,
    courseId: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getFetch(`/api/v1/course/${courseId}/assignment/${assignmentId}/${lessonId}/submission/latestStatus`).then(
      (result) => {
        if (result.status == 200) {
          result.json().then((r) => {
            const apiResponse = r as ApiResponse;
            onSuccess(apiResponse);
          });
        } else {
          result.json().then((r) => {
            const failedResponse = r as FailedApiResponse;
            onFailure(failedResponse.error);
          });
        }
      }
    );
  };

  checkSubmissions = (
    assignmentId: number,
    lessonId: number,
    courseId: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getFetch(`/api/v1/course/${courseId}/assignment/${assignmentId}/${lessonId}/submission/list-submissions`).then(
      (result) => {
        if (result.status == 200) {
          result.json().then((r) => {
            const apiResponse = r as ApiResponse;
            onSuccess(apiResponse);
          });
        } else {
          result.json().then((r) => {
            const failedResponse = r as FailedApiResponse;
            onFailure(failedResponse.error);
          });
        }
      }
    );
  };

  getAllAssignment = (
    lessonId: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getFetch(`/api/v1/resource/assignment/get-all?lessonId=${lessonId}`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  deleteAssignment = (
    assignmentId: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getDelete(`/api/v1/resource/assignment/delete?assignment=${assignmentId}`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  deleteAssignmentArchive = (
    archiveUrl: string,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getDelete(`/api/v1/resource/assignment/archive/delete?archiveUrl=${archiveUrl}`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  submitAssignment = (
    data: {
      content: any;
      courseId: number;
      lessonId: number;
      assignmentId: number;
    },
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(
      data,
      `/api/v1/course/${data.courseId}/assignment/${data.assignmentId}/${data.lessonId}/submission/submit`
    ).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  saveAssignment = (
    data: {
      content: any;
      courseId: number;
      lessonId: number;
      assignmentId: number;
    },
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(
      data,
      `/api/v1/course/${data.courseId}/assignment/${data.assignmentId}/${data.lessonId}/submission/save`
    ).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  previewAssignment = (
    codeData: string[][],
    courseId: number,
    assignmentId: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch({ codeData }, `/api/v1/course/${courseId}/assignment/${assignmentId}/save`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };
  listSubmission = (onSuccess: (response: ApiResponse) => void, onFailure: (message: string) => void) => {
    getFetch(`/api/v1/admin/submission/list`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  getSubmissionDetail = (
    id: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getFetch(`/api/v1/admin/submission/get?submissionId=${id}`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };

  createEvaluation = (
    evaluateDetail: { assignmentId: number; submissionId: number; score: number; comment: string },
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(evaluateDetail, `/api/v1/admin/submission/evaluate`).then((result) => {
      if (result.status == 200) {
        result.json().then((r) => {
          const apiResponse = r as ApiResponse;
          onSuccess(apiResponse);
        });
      } else {
        result.json().then((r) => {
          const failedResponse = r as FailedApiResponse;
          onFailure(failedResponse.error);
        });
      }
    });
  };
}

export default new AssignmentSerivce();
