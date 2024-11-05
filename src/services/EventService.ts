import { EventAccess, EventMode, Events, EventType, StateType } from "@prisma/client";
import { getDelete, getFetch, postFetch } from "./request";

interface ApiResponse {
  result: IEventList;
  success: boolean;
  error: string;
  message: string;
  status: EventAccess;
  totalEvents: IEventListTable[];
  updatedEvent: Events;
  eventId: number;
  eventList: IEventList[];
  totalEventsLength: number;
  eventRegistered: boolean;
  eventDetails: Events;
  isRegistered: boolean;
  registrationId: number;
  registrationListInfo: IAttendessInfo[];
}

export interface IEventCertificateInfo {
  eventId: number;
  name: string;
  registrationId: number;
  email: string;
}

export interface IAttendessInfo {
  name: string;
  email: string;
  certificate: string;
  registrationDate: string;
  attended: boolean;
  id: number;
  comment: string;
  status: EventAccess;
  event: {
    title: string;
  };
}

export interface IAccessInfo {
  status: EventAccess;
  name: string;
  comment?: string;
  email: string;
  eventId: number;
}
export interface IEventListTable {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  mode: EventMode;
  eventType: EventType;
  state: StateType;
  author: string;
  slug: string;
  attendees: IAttendessInfo[];
  user: {
    name: string;
  };
}

export interface IEventInfo {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  mode: EventMode;
  eventType: EventType;
  price: number;
  state: StateType;
  banner: string;
  location: string;
  eventMode: EventMode;
  eventLink: string;
  author: string;
  slug: string;
  eventInstructions: string;
  description: string;
  registrationEndDate: string;
  user: {
    name: string;
  };
}

export interface IEventList {
  banner: string;
  startTime: string;
  eventMode: EventMode;
  eventType: EventType;
  title: string;
  slug: string;
  location: string;
  attended?: boolean;
  registrationExpired: boolean;
}

export interface IEventUpdate {
  title?: string;
  banner?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  eventType?: EventType;
  price?: number;
  eventInstructions?: string;
  eventMode?: EventMode;
  registrationEndDate?: Date;
  eventLink?: string;
  certificate?: boolean;
  location?: string;
  id?: number;
  state?: StateType;
  slug?: string;
  certificateTemplate?: string;
}

type FailedApiResponse = {
  error: string;
};
class EventService {
  createEvent = (
    data: IEventUpdate,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(data, `/api/v1/admin/events/create`).then((result) => {
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

  updateEvent = (
    updateData: IEventUpdate,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(updateData, `/api/v1/admin/events/update`).then((result) => {
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

  listEvents = (onSuccess: (response: ApiResponse) => void, onFailure: (message: string) => void) => {
    getFetch(`/api/v1/admin/events/list`).then((result) => {
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

  getEvents = (
    pageSize: number,
    skip: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch({ pageSize, skip }, `/api/v1/admin/events/all-events`).then((result) => {
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

  eventDetails = (
    eventId: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getFetch(`/api/v1/admin/events/${eventId}`).then((result) => {
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

  deleteEvent = (eventId: number, onSuccess: (response: ApiResponse) => void, onFailure: (message: string) => void) => {
    getDelete(`/api/v1/admin/events/delete/${eventId}`).then((result) => {
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

  eventRegistration = (
    data: {
      eventId: number;
      phone?: number;
      email?: string;
      name?: string;
    },
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(data, `/api/v1/events/registration`).then((result) => {
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
  registrationStatus = (
    eventId: number,

    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch({ eventId }, `/api/v1/events/status/${eventId}`).then((result) => {
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

  markAttended = (
    data: {
      eventId: number;
      email?: string;
    },
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(data, `/api/v1/admin/events/mark-attended`).then((result) => {
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

  generateEventCertificate = (
    certificateInfo: { eventId: number; name: string; registrationId: number; email: string },

    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(certificateInfo, `/api/v1/admin/events/generate-certificate`).then((result) => {
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

  grantAccess = (
    accessInfo: IAccessInfo,

    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    postFetch(accessInfo, `/api/v1/admin/events/grant-permission`).then((result) => {
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

  registrationList = (
    eventId: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getFetch(`/api/v1/admin/events/registration-list/${eventId}`).then((result) => {
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
  eventAttendeesList = (
    eventId: number,
    onSuccess: (response: ApiResponse) => void,
    onFailure: (message: string) => void
  ) => {
    getFetch(`/api/v1/admin/events/attendees-list/${eventId}`).then((result) => {
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

export default new EventService();
