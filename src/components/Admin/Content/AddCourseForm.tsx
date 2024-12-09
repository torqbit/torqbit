import React, { FC, useEffect, useState } from "react";
import AppLayout from "@/components/Layouts/AppLayout";
import Link from "next/link";
import Setting from "./Setting";
import styles from "@/styles/Dashboard.module.scss";
import { Divider, Dropdown, Form, Tabs, TabsProps, message } from "antd";
import SvgIcons from "@/components/SvgIcons";
import Curriculum from "./Curriculum";
import { useRouter } from "next/router";
import Preview from "./Preview";
import ProgramService from "@/services/ProgramService";
import {
  ChapterDetail,
  CourseData,
  CourseLessonAPIResponse,
  IVideoLesson,
  VideoAPIResponse,
  VideoInfo,
} from "@/types/courses/Course";
import AddCourseChapter from "@/components/Admin/Content/AddCourseChapter";
import { $Enums, ResourceContentType, StateType, VideoState } from "@prisma/client";
import { ResourceDetails } from "@/lib/types/program";
import { RcFile } from "antd/es/upload";
import { postWithFile } from "@/services/request";

import AddLesson from "./AddLesson";
import { PageSiteConfig } from "@/services/siteConstant";
import cmsClient from "@/lib/admin/cms/cmsClient";

const AddCourseForm: FC<{ siteConfig: PageSiteConfig }> = ({ siteConfig }) => {
  const [courseBannerUploading, setCourseBannerUploading] = useState<boolean>(false);
  const [courseTrailerUploading, setCourseTrailerUploading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [resourceContentType, setContentType] = useState<ResourceContentType>();
  const [refresh, setRefresh] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<string>("1");
  const [isEdit, setEdit] = useState<boolean>(false);
  const [isChapterEdit, setChapterEdit] = useState<boolean>(false);
  const [currResId, setResId] = useState<number>();
  const [selectedChapterId, setSelectedChapterId] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tabActive, setTabActive] = useState<boolean>(false);
  const [chapterForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [videoForm] = Form.useForm();
  const [settingloading, setSettingloading] = useState<boolean>(false);
  const [checkVideoState, setCheckVideoState] = useState<boolean>(false);

  const [selectedCourseType, setSelectedCourseType] = useState<{
    free: boolean;
    paid: boolean;
  }>({
    free: false,
    paid: false,
  });

  const selectCourseType = (courseType: $Enums.CourseType) => {
    courseType === $Enums.CourseType.FREE
      ? setSelectedCourseType({ paid: false, free: true })
      : setSelectedCourseType({ paid: true, free: false });
    onSetCourseData("courseType", courseType);
  };

  const [showResourceDrawer, setResourceDrawer] = useState<boolean>(false);
  const onRefresh = () => {
    setRefresh(!refresh);
  };

  const onChange = (key: string) => {
    if (key === "3") {
      onRefresh();
      router.replace(`/admin/content/course/${router.query.id}/edit`);
      setActiveKey("3");
    }
    setActiveKey(key);
  };

  const [videoLesson, setVideoLesson] = useState<IVideoLesson>({
    title: "Untitled",
    description: "Description about the lesson",
  });

  const router = useRouter();

  const [uploadVideo, setUploadVideo] = useState<VideoInfo>();
  const [courseThumbnail, setCourseThumbnail] = useState<string>();

  const [courseData, setCourseData] = useState<CourseData>({
    name: "",
    description: "",
    expiryInDays: 365,
    chapters: [],
    courseType: $Enums.CourseType.FREE,
  });

  const onDiscard = () => {
    ProgramService.deleteCourse(
      Number(router.query.id),
      (result) => {
        messageApi.success(result.message);
        router.push(`/admin/content`);
      },
      (error) => {
        messageApi.error(error);
      }
    );
  };

  const onSubmit = () => {
    setSettingloading(true);

    let course = {
      name: form.getFieldsValue().course_name || courseData?.name,
      expiryInDays: Number(courseData?.expiryInDays),
      description: form.getFieldsValue().course_description || courseData.description,
      courseId: Number(router.query.id),
      difficultyLevel: courseData.difficultyLevel,
      certificateTemplate: courseData.certificateTemplate,
      previewMode: form.getFieldsValue().previewMode ? form.getFieldsValue().previewMode : false,
      courseType: courseData.courseType,
      coursePrice: courseData.courseType === $Enums.CourseType.FREE ? 0 : Number(courseData.coursePrice),
    };
    ProgramService.updateCourse(
      course,
      (result) => {
        setActiveKey("2");
        form.resetFields();
        setRefresh(!refresh);
        setTabActive(true);
        messageApi.success("Course has been updated");
        setSettingloading(false);
      },
      (error) => {
        messageApi.error(error);
        setSettingloading(false);
      }
    );
  };

  const onSetCourseData = (key: string, value: string) => {
    setCourseData({ ...courseData, [key]: value });
  };

  let currentSeqIds = courseData.chapters.map((c) => {
    return c.sequenceId;
  });

  const showChapterDrawer = (value: boolean) => {
    setOpen(value);
  };

  const onDeleteResource = (id: number) => {
    ProgramService.deleteResource(
      id,
      Number(router.query.id),
      (result) => {
        messageApi.success(result.message);
        onRefresh();
      },
      (error) => {
        messageApi.error(error);
      }
    );
  };

  const handleNewChapter = () => {
    setChapterEdit(false);
    setOpen(true);
  };

  const handleChapterEdit = async (chapterId: number) => {
    setSelectedChapterId(chapterId);
    ProgramService.getChapter(
      chapterId,
      (result) => {
        chapterForm.setFieldValue("name", result.chapter.name);
        chapterForm.setFieldValue("description", result.chapter.description);
        showChapterDrawer(true);
        setChapterEdit(true);
      },
      (error) => {
        messageApi.error(error);
      }
    );
  };

  const onAddResource = (chapterId: number, content: ResourceContentType) => {
    setEdit(false);
    ProgramService.createResource(
      {
        chapterId: chapterId,
        name: "Untitled",
        description: "Description about the lesson",
        contentType: content,
      } as ResourceDetails,
      (result) => {
        content === $Enums.ResourceContentType.Assignment;
        videoForm.setFieldValue("name", result.resource.name);
        videoForm.setFieldValue("description", result.resource.description);
        setResId(result.resource.resourceId);
        setLoading(false);
        !showResourceDrawer && setResourceDrawer(true);
        setVideoLesson({ ...videoLesson, chapterId: chapterId, video: undefined });
        setContentType(content);
      },
      (error) => {
        messageApi.error(error);
      }
    );
  };

  const onUploadTrailer = async (file: RcFile, title: string) => {
    setCourseTrailerUploading(true);

    const chunkSize = 2 * 1024 * 1024; // 1MB chunks (adjust as needed)
    const totalChunks = Math.ceil(file.size / chunkSize);
    let start = 0;
    let end = chunkSize;
    const name = title.replace(/\s+/g, "-");

    let courseIdStr = router.query.id?.toString();

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const chunk = file.slice(start, end);
      const formData = new FormData();
      formData.append("file", chunk, file.name);
      formData.append("chunkIndex", String(chunkIndex));
      formData.append("totalChunks", String(totalChunks));
      formData.append("title", name);
      formData.append("objectId", courseIdStr || "");
      formData.append("objectType", "course");
      const postRes = await postWithFile(formData, `/api/v1/upload/video/upload`);

      start = end;
      end = start + chunkSize;
      if (!postRes.ok) {
        setLoading(false);
        const response = (await postRes.json()) as VideoAPIResponse;

        messageApi.error(response.message);

        setCourseTrailerUploading(false);
      }
      const res = (await postRes.json()) as VideoAPIResponse;

      if (res.success) {
        setUploadVideo({
          ...uploadVideo,
          videoId: res.video.videoId,
          videoUrl: res.video.videoUrl,
          thumbnail: res.video.thumbnail,
          previewUrl: res.video.previewUrl,
          videoDuration: res.video.videoDuration,
          state: res.video.state,
          mediaProviderName: res.video.mediaProviderName,
        });
        messageApi.success("Course trailer video has been uploaded");
        setCourseTrailerUploading(false);
        setCheckVideoState(true);
      }
    }
  };

  const uploadFile = async (file: any, title: string) => {
    if (file) {
      setCourseBannerUploading(true);
      const name = title.replace(/\s+/g, "-");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", name);
      formData.append("fileType", "banner");

      courseThumbnail && formData.append("existingFilePath", courseThumbnail);

      cmsClient.uploadFile(
        formData,
        (result) => {
          let course = {
            thumbnail: result.fileCDNPath,
            courseId: Number(router.query.id),
          };
          ProgramService.updateCourse(
            course,
            (res) => {
              setCourseThumbnail(result.fileCDNPath);
              messageApi.success("file uploaded");
              setCourseBannerUploading(false);
            },
            (error) => {
              setCourseBannerUploading(false);
              messageApi.error(error);
            }
          );
        },
        (error) => {
          messageApi.error(error);
        }
      );
    }
  };

  const onEditResource = (id: number, content: ResourceContentType) => {
    setResId(id);
    setContentType(content);
    ProgramService.getResource(
      id,
      (result) => {
        videoForm.setFieldValue("name", result.resource?.name);
        videoForm.setFieldValue("description", result.resource?.description);
        videoForm.setFieldValue("videoUrl", result.resource?.video?.videoUrl);
        setVideoLesson({ ...videoLesson, chapterId: result.resource.chapterId, video: result.resource.video });

        setResourceDrawer(true);
        setEdit(true);
      },
      (error) => {
        messageApi.error(error);
      }
    );
  };

  const onPublishCourse = (state: string) => {
    if (
      courseData.chapters.length > 0 &&
      courseData.chapters[0].resource.filter((r) => r.state === StateType.ACTIVE).length >= 2
    ) {
      ProgramService.updateCourseState(
        Number(router.query.id),
        state,
        (result) => {
          router.push("/courses");
        },
        (error) => {}
      );
    } else {
      message.error("Minimum two published lessons are required to publish the course");
    }
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Settings",
      children: (
        <Setting
          onSetCourseData={onSetCourseData}
          form={form}
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          courseData={courseData}
          onUploadTrailer={onUploadTrailer}
          uploadFile={uploadFile}
          uploadVideo={uploadVideo}
          courseBannerUploading={courseBannerUploading}
          courseTrailerUploading={courseTrailerUploading}
          courseBanner={courseThumbnail}
          settingLoading={settingloading}
          selectedCourseType={selectedCourseType}
          selectCourseType={selectCourseType}
        />
      ),
    },
    {
      key: "2",
      label: (
        <span onClick={() => !tabActive && message.error("First fill and  save  the add course form ")}>
          Curriculum
        </span>
      ),
      disabled: (!courseThumbnail && !uploadVideo?.videoUrl) || !tabActive,

      children: courseThumbnail && uploadVideo?.videoUrl && (
        <Curriculum
          chapters={courseData.chapters}
          onRefresh={onRefresh}
          handleNewChapter={handleNewChapter}
          onAddResource={onAddResource}
          handleEditChapter={handleChapterEdit}
          deleteRes={onDeleteResource}
          onEditResource={onEditResource}
          onSave={onChange}
          onDiscard={onDiscard}
        />
      ),
    },

    {
      key: "3",
      label: (
        <span onClick={() => !tabActive && message.error("First fill and  save  the add course form ")}>Preview</span>
      ),
      disabled: (!courseThumbnail && !uploadVideo?.videoUrl) || !tabActive,
      children: courseThumbnail && uploadVideo?.videoUrl && (
        <Preview
          videoUrl={uploadVideo?.videoUrl}
          onEnrollCourse={() => {}}
          courseDetail={
            {
              course: {
                name: courseData.name,
                description: courseData.description,
                courseTrailer: uploadVideo.videoUrl,
              },
              lessons: courseData.chapters.map((c: ChapterDetail) => {
                return {
                  chapterSeq: c.sequenceId,
                  chapterName: c.name,
                  lessons: c.resource.map((r) => {
                    if (r.video) {
                      return {
                        videoId: r.video.id,
                        lessonId: r.resourceId,
                        videoUrl: r.video.videoUrl,
                        videoDuration: r.video.videoDuration,
                        isWatched: false,
                        title: r.name,
                        contentType: r.contentType,
                      };
                    } else if (r.assignment) {
                      return {
                        lessonId: r.resourceId,
                        isWatched: false,
                        title: r.name,
                        contentType: r.contentType,
                        videoDuration: r.assignment.estimatedDuration ? r.assignment.estimatedDuration * 60 : 0,
                      };
                    }
                  }),
                };
              }),
            } as CourseLessonAPIResponse
          }
          addContentPreview={true}
        />
      ),
    },
  ];

  useEffect(() => {
    let intervalId: NodeJS.Timer | undefined;
    if (
      checkVideoState &&
      uploadVideo &&
      uploadVideo.state == VideoState.PROCESSING &&
      typeof intervalId === "undefined"
    ) {
      intervalId = setInterval(() => {
        ProgramService.getCourseDetails(
          Number(router.query.id),
          (result) => {
            setUploadVideo({
              ...uploadVideo,
              previewUrl: "",
              thumbnail: result.courseDetails.tvThumbnail,
              videoId: result.courseDetails.tvProviderId,
              videoUrl: result.courseDetails.tvUrl,
              videoDuration: result.courseDetails.durationInMonths,
              state: result.courseDetails.tvState,
              mediaProviderName: "",
            });
            setCheckVideoState(result.courseDetails.tvState == VideoState.PROCESSING);
          },
          (error) => {
            messageApi.error(error);
          }
        );
      }, 1000 * 5); // in milliseconds
    }
    if (intervalId && uploadVideo && uploadVideo.state == VideoState.READY) {
      clearInterval(Number(intervalId));
    }
    return () => intervalId && clearInterval(Number(intervalId));
  }, [checkVideoState]);

  useEffect(() => {
    setSettingloading(true);

    router.query.id &&
      ProgramService.getCourseDetails(
        Number(router.query.id),
        (result) => {
          setUploadVideo({
            ...uploadVideo,
            previewUrl: "",
            thumbnail: result.courseDetails.tvThumbnail,
            videoId: result.courseDetails.tvProviderId,
            videoUrl: result.courseDetails.tvUrl,
            videoDuration: result.courseDetails.durationInMonths,
            state: result.courseDetails.tvState,
            mediaProviderName: "",
          });
          setCheckVideoState(result.courseDetails.tvState == VideoState.PROCESSING);
          form.setFieldValue("course_name", result.courseDetails.name);
          form.setFieldValue("course_description", result.courseDetails.description);
          form.setFieldValue("course_duration", result.courseDetails.expiryInDays);
          form.setFieldValue("course_difficulty", result.courseDetails.difficultyLevel);
          form.setFieldValue("certificate_template", result.courseDetails.certificateTemplate);
          form.setFieldValue("previewMode", result.courseDetails.previewMode);

          if (result.courseDetails.chapters.length > 0 || result.courseDetails.videoUrl) {
            setTabActive(true);
          }
          selectCourseType(result.courseDetails.courseType as $Enums.CourseType);
          setCourseData({
            ...courseData,
            expiryInDays: result.courseDetails.expiryInDays,
            name: result.courseDetails.name,
            description: result.courseDetails.description,
            chapters: result.courseDetails.chapters,
            difficultyLevel: result.courseDetails.difficultyLevel,
            state: result?.courseDetails.state,
            coursePrice: result.courseDetails.coursePrice,

            courseType: result.courseDetails.courseType,
          });

          setCourseThumbnail(result.courseDetails.thumbnail);
          setSettingloading(false);
        },
        (error) => {
          messageApi.error(error);
          setSettingloading(false);
        }
      );
  }, [router.query.id, refresh]);
  return (
    <AppLayout siteConfig={siteConfig}>
      {contextHolder}
      <section className={styles.add_course_page}>
        <div className={styles.add_course_header}>
          <div className={styles.left_icon}>
            <Link href="/admin/content">{SvgIcons.xMark}</Link>
            <Divider type="vertical" style={{ height: "1.2rem" }} />
            <h4>Edit Course</h4>
          </div>
          <div>
            <Dropdown.Button
              type="primary"
              onClick={() => {
                courseData.state === StateType.DRAFT
                  ? onPublishCourse(StateType.ACTIVE)
                  : onPublishCourse(StateType.DRAFT);
              }}
              icon={SvgIcons.chevronDown}
              menu={{
                items: [
                  {
                    key: 1,
                    label: courseData.state === StateType.DRAFT ? "Save and exit" : "Publish Course",
                    onClick: () => {
                      router.push("/admin/content");
                    },
                  },
                ],
              }}
            >
              {courseData.state === StateType.DRAFT ? "  Publish Course" : "Save as Draft"}
            </Dropdown.Button>
          </div>
        </div>
        <Tabs
          tabBarGutter={40}
          activeKey={activeKey}
          className={styles.add_course_tabs}
          items={items}
          onChange={onChange}
        />
      </section>
      <AddCourseChapter
        courseId={Number(router.query.id)}
        onRefresh={onRefresh}
        currentSeqIds={currentSeqIds}
        showChapterDrawer={showChapterDrawer}
        loading={loading}
        form={chapterForm}
        chapterLength={courseData.chapters.length}
        open={open}
        chapterId={selectedChapterId}
        edit={isChapterEdit}
        setEdit={setChapterEdit}
      />

      {currResId && (
        <AddLesson
          showResourceDrawer={showResourceDrawer}
          setVideoLesson={setVideoLesson}
          videoLesson={videoLesson}
          onRefresh={onRefresh}
          setResourceDrawer={setResourceDrawer}
          contentType={resourceContentType as ResourceContentType}
          currResId={currResId}
          onDeleteResource={onDeleteResource}
          form={videoForm}
          isEdit={isEdit}
          setCheckVideoState={setCheckVideoState}
          setEdit={setEdit}
        />
      )}
    </AppLayout>
  );
};

export default AddCourseForm;
