import SvgIcons from "@/components/SvgIcons";
import ProgramService from "@/services/ProgramService";
import { CourseLessons, IAssignmentDetail, VideoLesson } from "@/types/courses/Course";
import styles from "@/styles/LearnCourses.module.scss";
import {
  Avatar,
  Breadcrumb,
  Button,
  Collapse,
  Flex,
  List,
  MenuProps,
  Segmented,
  Skeleton,
  Space,
  Spin,
  Tabs,
  TabsProps,
  Tag,
  message,
} from "antd";
import { GetServerSidePropsContext, NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, ReactNode, useEffect, useState } from "react";
import { IResourceDetail } from "@/lib/types/learn";
import { convertSecToHourandMin } from "@/pages/admin/content";
import QADiscssionTab from "@/components/LearnCourse/AboutCourse/CourseDiscussion/CourseDiscussion";
import { postFetch } from "@/services/request";
import appConstant from "@/services/appConstant";

import { ICourseProgressUpdateResponse } from "@/lib/types/program";
import { getUserEnrolledCoursesId } from "@/actions/getEnrollCourses";
import { generateDayAndYear, getCookieName, getExtension } from "@/lib/utils";
import { getToken } from "next-auth/jwt";
import SpinLoader from "@/components/SpinLoader/SpinLoader";
import { useMediaQuery } from "react-responsive";
import { $Enums, ResourceContentType, Role } from "@prisma/client";
import ViewAssignment from "@/components/Assignment/ViewAssignment";
import prisma from "@/lib/prisma";
import AssignmentService from "@/services/course/AssignmentService";
import { useAppContext } from "@/components/ContextApi/AppContext";
import LessonListSideBar from "@/components/Lessons/LessonListSideBar";
import AppLayout from "@/components/Layouts/AppLayout";
import { PageSiteConfig } from "@/services/siteConstant";
import { getSiteConfig } from "@/services/getSiteConfig";

export interface ICertficateData {
  loading: boolean;
  certificateId: string;
  completed: boolean;
}

const LessonItem: FC<{
  title: string;
  keyValue: string;
  selectedLesson: IResourceDetail | undefined;
  resourceId: number;
  loading: boolean;
  refresh: boolean;
  icon: ReactNode;
}> = ({ title, loading, refresh, selectedLesson, keyValue, icon, resourceId }) => {
  const [completed, setCompleted] = useState<boolean>();

  return (
    <>
      {loading ? (
        <Skeleton.Button />
      ) : (
        <div
          style={{
            padding: resourceId > 0 ? "5px 0px" : 0,
            paddingLeft: resourceId > 0 ? "20px" : 0,
          }}
          className={`${selectedLesson && resourceId === selectedLesson.resourceId && styles.selectedLable} ${resourceId > 0 ? styles.lessonLabelContainer : styles.labelContainer
            }`}
        >
          <Flex justify="space-between" align="center" onClick={() => { }}>
            <div className={styles.title_container}>
              <Flex gap={10} align="center">
                {completed ? SvgIcons.check : icon}
                <div style={{ cursor: "auto" }}>{title}</div>
              </Flex>
            </div>
          </Flex>
          <div className={styles.selected_bar}></div>
        </div>
      )}
    </>
  );
};

const LessonPage: NextPage<{ siteConfig: PageSiteConfig; courseId: number }> = ({ siteConfig, courseId }) => {
  const router = useRouter();
  const isMobile = useMediaQuery({ query: "(max-width: 933px)" });
  const { globalState } = useAppContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [markAsLoading, setMarkAsLoading] = useState<boolean>(false);

  const [courseDetail, setCourseDetails] = useState<{
    name: string;
    description: string;
    previewMode: boolean;
    userRole: string;
  }>();
  const [courseLessons, setCourseLessons] = useState<CourseLessons[]>([]);
  const [currentLesson, setCurrentLesson] = useState<{
    chapterName?: string;
    chapterSeq?: number;
    lesson?: VideoLesson;
  }>();
  const [messageApi, contextMessageHolder] = message.useMessage();
  const [loadingLesson, setLessonLoading] = useState<boolean>(false);
  const { data: session } = useSession();

  const [refresh, setRefresh] = useState<boolean>(false);
  const [certificateData, setCertificateData] = useState<ICertficateData>();
  const [assignmentDetail, setAssignmentDetail] = useState<IAssignmentDetail>();
  const [tabKey, setTabKey] = useState<string>("");

  const onCreateCertificate = () => {
    setCertificateData({ ...certificateData, loading: !courseDetail?.previewMode, completed: true } as ICertficateData);
    ProgramService.createCertificate(
      Number(courseId),
      (result) => {
        setCertificateData({
          certificateId: result.certificateIssueId,
          loading: false,
          completed: true,
        } as ICertficateData);
      },
      (error) => {
        setCertificateData({ ...certificateData, loading: false, completed: true } as ICertficateData);
      }
    );
  };

  const findAndSetCurrentLesson = (chapterLessons: CourseLessons[], markAsCompleted: boolean) => {
    chapterLessons.forEach((ch) => {
      let foundLesson = ch.lessons.find((l) => l.lessonId == Number(router.query.lessonId));
      if (foundLesson) {
        if (markAsCompleted) {
          foundLesson = {
            ...foundLesson,
            isWatched: true,
          };
        }
        setCurrentLesson({ chapterName: ch.chapterName, chapterSeq: ch.chapterSeq, lesson: foundLesson });
      }
    });
  };

  const updateChapterLesson = (chapterSeq: number, lessonId: number) => {
    let copyChapterLessons = [...courseLessons];
    const updatedChapters = copyChapterLessons.map((stateCh) => {
      if (stateCh.chapterSeq == chapterSeq) {
        const updatedLessons = stateCh.lessons.map((l) => {
          if (l.lessonId == lessonId) {
            return {
              ...l,
              isWatched: true,
            };
          } else return l;
        });
        return {
          ...stateCh,
          lessons: updatedLessons,
        };
      } else return stateCh;
    });

    setCourseLessons(updatedChapters);
  };

  const moveToNextLesson = (currentLessonId: number, lessonsCompleted: number, totalLessons: number) => {
    currentLesson?.chapterSeq &&
      currentLesson?.lesson &&
      updateChapterLesson(currentLesson.chapterSeq, currentLesson.lesson.lessonId);
    if (lessonsCompleted == totalLessons) {
      //go to certificate page
      findAndSetCurrentLesson(courseLessons, true);

      !courseDetail?.previewMode && courseDetail?.userRole === Role.STUDENT && onCreateCertificate();

      console.log("go to certificate page");
    } else {
      let nextLessonId = 0;
      courseLessons.forEach((ch, chapterIndex) => {
        const currentLessonIndex = ch.lessons.findIndex((l) => l.lessonId == currentLessonId);
        if (currentLessonIndex >= 0 && currentLessonIndex != ch.lessons.length - 1) {
          nextLessonId = ch.lessons[currentLessonIndex + 1].lessonId;
        } else if (currentLessonIndex >= 0 && currentLessonIndex == ch.lessons.length - 1) {
          if (chapterIndex == courseLessons.length - 1 && lessonsCompleted == totalLessons) {
            //move to complete course
            console.log(`Don't go any where but update the current lesson state`);
            findAndSetCurrentLesson(courseLessons, true);
          } else if (chapterIndex == courseLessons.length - 1 && lessonsCompleted < totalLessons) {
            console.log(`Other lessons are still pending, but update the current lesson state`);
            findAndSetCurrentLesson(courseLessons, true);
          } else if (chapterIndex < courseLessons.length - 1) {
            console.log(`Move to the next lesson`);
            const nextChapter = courseLessons[chapterIndex + 1];
            nextLessonId = nextChapter.lessons[0].lessonId;
          }
        }
      });

      if (nextLessonId > 0) {
        router.push(`/courses/${router.query.slug}/lesson/${nextLessonId}`);
      }
    }
  };

  const updateAssignmentWatchedStatus = (chapterSeqId: number, lessonId: number) => {
    setCourseLessons((prevLessons) =>
      prevLessons.map((ch) => {
        if (ch.chapterSeq === chapterSeqId) {
          return {
            ...ch,
            lessons: ch.lessons.map((l) => {
              if (l.contentType === ResourceContentType.Assignment && l.lessonId === lessonId) {
                return {
                  ...l,
                  isWatched: true,
                };
              } else {
                return l;
              }
            }),
          };
        } else {
          return ch;
        }
      })
    );
  };

  const getLessonsDetail = (courseId: number) => {
    ProgramService.getCourseLessons(
      Number(courseId),
      (result) => {
        setCourseLessons(result.lessons);
        setLessonLoading(false);
        setCourseDetails({
          name: result.course.name,
          description: result.course.description,
          previewMode: result.course.previewMode,
          userRole: result.course.userRole,
        });
        findAndSetCurrentLesson(result.lessons, false);
      },
      (error) => {
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    courseId && getLessonsDetail(Number(courseId));
  }, [courseId]);

  useEffect(() => {
    if (router.query.lessonId && courseLessons.length > 0) {
      findAndSetCurrentLesson(courseLessons, false);
    }
  }, [router.query.lessonId]);

  const lessonItems = courseLessons.map((content, index) => {
    let totalTime = 0;
    content.lessons.forEach((data) => {
      totalTime = totalTime + data.videoDuration;
    });
    const duration = convertSecToHourandMin(totalTime);
    const videoLessons = (
      <List
        size="small"
        itemLayout="horizontal"
        dataSource={content.lessons}
        renderItem={(item, index) => (
          <List.Item
            style={{
              padding: "8px 8px 8px 16px",
            }}
            className={
              Number(router.query.lessonId) == item.lessonId
                ? `${styles.lesson__selected}`
                : `${styles.lesson__default}`
            }
          >
            <Link href={`/courses/${router.query.slug}/lesson/${item.lessonId}`} className={styles.lesson__item}>
              <div style={{ display: "flex" }}>
                <i style={{ height: 20 }}>
                  {item.isWatched ? (
                    SvgIcons.check
                  ) : (
                    <>{item.contentType === $Enums.ResourceContentType.Video ? SvgIcons.playBtn : SvgIcons.file}</>
                  )}
                </i>
                <p style={{ marginBottom: 0, marginLeft: 5 }}>{item.title}</p>
              </div>

              <div>
                {
                  <Tag style={{ marginRight: 0 }} className={styles.time_tag}>
                    {convertSecToHourandMin(
                      item.contentType === ResourceContentType.Video
                        ? item.videoDuration
                        : Number(item.estimatedDuration) * 60
                    )}
                  </Tag>
                }
              </div>
            </Link>
          </List.Item>
        )}
      />
    );
    return {
      key: `${content.chapterSeq}`,
      label: (
        <LessonItem
          title={content.chapterName}
          icon={SvgIcons.folder}
          loading={loading}
          resourceId={0}
          selectedLesson={undefined}
          keyValue={`${content.chapterSeq}`}
          refresh={refresh}
        />
      ),
      children: videoLessons,
      showArrow: false,
    };
  });

  const getLessonItems = (contentType: ResourceContentType, isWatched: boolean) => {
    switch (contentType) {
      case ResourceContentType.Assignment:
        return isWatched ? SvgIcons.check : SvgIcons.file;

      case ResourceContentType.Video:
        return isWatched ? SvgIcons.check : SvgIcons.playBtn;
    }
  };

  const lessonMenuList: MenuProps["items"] = courseLessons.map((ch, i) => {
    return {
      type: "group",
      icon: <i style={{ fontSize: 18, width: 20 }}>{SvgIcons.folder}</i>,
      label: ch.chapterName,
      key: i,
      children: ch.lessons.map((l) => {
        return {
          label: (
            <Link href={`/courses/${router.query.slug}/lesson/${l.lessonId}`}>
              <Flex align="center" justify="space-between">
                <span>{l.title}</span>
                <Tag style={{ marginRight: 0 }} className={styles.time_tag}>
                  {convertSecToHourandMin(
                    l.contentType === ResourceContentType.Video ? l.videoDuration : Number(l.estimatedDuration) * 60
                  )}
                </Tag>
              </Flex>
            </Link>
          ),
          key: `${l.lessonId}`,
          icon: getLessonItems(l.contentType as ResourceContentType, l.isWatched),
        };
      }),
    };
  });

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "About",
      children: currentLesson?.lesson?.description,
    },
    {
      key: "discussions",
      label: "Discussions",

      children: session && currentLesson?.lesson && (
        <QADiscssionTab
          loading={loading}
          resourceId={tabKey === "discussions" ? currentLesson.lesson.lessonId : undefined}
        />
      ),
    },
  ];

  const ResponsiveLessonItemsList = (
    <div className={styles.lesson_wrapper}>
      <div className={styles.lessons_container}>
        {lessonItems?.map((item, i) => {
          return (
            <div key={i} className={styles.lessons_list_wrapper}>
              <Collapse
                defaultActiveKey={`${currentLesson?.chapterSeq}`}
                size="small"
                bordered={false}
                accordion={false}
                activeKey={courseLessons.map((ch) => ch.chapterSeq.toString())}
                items={[
                  {
                    key: item.key,
                    label: item.label,
                    children: item.children,
                    showArrow: false,
                  },
                ]}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  const responsiveItems: TabsProps["items"] = [
    {
      key: "1",
      label: "Lessons",
      children: ResponsiveLessonItemsList,
    },
    {
      key: "2",
      label: "About",
      children: currentLesson?.lesson?.description,
    },
    {
      key: "discussions",
      label: "Discussions",

      children: session && currentLesson?.lesson && (
        <QADiscssionTab
          loading={loading}
          resourceId={tabKey === "discussions" ? currentLesson.lesson.lessonId : undefined}
        />
      ),
    },
  ];

  const onMarkAsCompleted = async () => {
    try {
      setMarkAsLoading(true);
      const res = await postFetch(
        {
          courseId: Number(courseId),
          resourceId: Number(router.query.lessonId),
        },
        `/api/v1/course/${courseId}/update-progress`
      );
      const result = (await res.json()) as ICourseProgressUpdateResponse;
      if (res.ok && result.success) {
        messageApi.success(result.message);
        moveToNextLesson(Number(router.query.lessonId), result.progress.lessonsCompleted, result.progress.totalLessons);
        setMarkAsLoading(false);
      } else {
        messageApi.error(result.error);
        setMarkAsLoading(false);
      }
    } catch (err) {
      messageApi.error(appConstant.cmnErrorMsg);
      setMarkAsLoading(false);
    }
  };

  const getAssignmentDetail = (lessonId: number) => {
    AssignmentService.getAssignment(
      lessonId,
      (result) => {
        setAssignmentDetail(result.assignmentDetail);
      },
      (error) => {
        messageApi.error(error);
      }
    );
  };

  useEffect(() => {
    currentLesson?.lesson?.contentType === ResourceContentType.Assignment &&
      getAssignmentDetail(currentLesson.lesson.lessonId);
  }, [currentLesson?.lesson?.lessonId]);

  const getVideoPlayerWidth = () => {
    if (globalState.collapsed && globalState.lessonCollapsed) {
      return "calc(100vw - 200px)";
    } else if (!globalState.collapsed && globalState.lessonCollapsed) {
      return "calc(100vw - 360px)";
    } else if (globalState.collapsed && !globalState.lessonCollapsed) {
      return "calc(100vw - 555px)";
    } else {
      return "calc(100vw - 735px)";
    }
  };

  return (
    <AppLayout siteConfig={siteConfig}>
      {contextMessageHolder}
      {!loading ? (
        <section className={styles.learn_course_page}>
          <div
            className={
              globalState.collapsed
                ? styles.lessons_collapsed_video_player_wrapper
                : styles.lessons_video_player_wrapper
            }
          >
            <div className={styles.learn_breadcrumb}>
              <Flex style={{ fontSize: 20 }}>
                <Breadcrumb
                  items={[
                    {
                      title: <Link href={`/courses`}>Courses</Link>,
                    },
                    {
                      title: courseDetail?.name,
                    },
                  ]}
                />
              </Flex>
            </div>

            <Flex className={styles.responsive_action_btn} align="center" justify="space-between">
              <Link href={`/courses/${router.query.slug}`}>
                <Button>
                  <Flex gap={5} align="center">
                    <i className={styles.goBackArrow}>{SvgIcons.arrowLeft}</i>
                    <div>Go Back</div>
                  </Flex>
                </Button>
              </Link>
              {courseDetail?.userRole === Role.STUDENT && (
                <>
                  {currentLesson?.lesson ? (
                    <>
                      {currentLesson?.lesson?.isWatched && (
                        <Button>
                          <Flex gap={5}>{SvgIcons.check} Completed </Flex>
                        </Button>
                      )}
                      {!currentLesson?.lesson?.isWatched && (
                        <Button loading={markAsLoading} type="primary" onClick={onMarkAsCompleted}>
                          Mark as Completed
                        </Button>
                      )}
                    </>
                  ) : (
                    <Skeleton.Button />
                  )}
                </>
              )}
            </Flex>

            {!certificateData?.completed ? (
              <div
                className={
                  currentLesson?.lesson?.contentType === $Enums.ResourceContentType.Video
                    ? styles.video_container
                    : styles.assignment_container
                }
              >
                {currentLesson?.lesson && (currentLesson?.lesson?.videoUrl || assignmentDetail) && !loadingLesson ? (
                  <div
                    className={styles.lesson_preview_container}
                    style={{ marginTop: currentLesson.lesson.contentType === ResourceContentType.Assignment ? -15 : 0 }}
                  >
                    {currentLesson.lesson.contentType === $Enums.ResourceContentType.Assignment ? (
                      <div>
                        <ViewAssignment
                          lessonId={currentLesson.lesson.lessonId}
                          discussionLoader={loading}
                          assignmentId={Number(assignmentDetail?.assignmentId)}
                          userRole={courseDetail?.userRole as Role}
                          ResponsiveLessonItemsList={ResponsiveLessonItemsList}
                          assignmentFiles={assignmentDetail?.assignmentFiles as string[]}
                          updateAssignmentWatchedStatus={updateAssignmentWatchedStatus}
                          chapterSeqId={Number(currentLesson.chapterSeq)}
                        />
                      </div>
                    ) : (
                      <iframe
                        allowFullScreen
                        style={{
                          position: "absolute",
                          width: isMobile ? "100%" : getVideoPlayerWidth(),
                          height: "100%",
                          outline: "none",
                          border: "none",
                          transition: "all .4s ease",
                          backgroundColor: "#283040",
                        }}
                        src={currentLesson?.lesson?.videoUrl}
                      ></iframe>
                    )}
                  </div>
                ) : (
                  <Skeleton.Image
                    style={{
                      position: "absolute",
                      width: isMobile ? "100%" : getVideoPlayerWidth(),
                      height: "100%",
                      top: 0,
                    }}
                  />
                )}
              </div>
            ) : (
              <>
                <div className={styles.certificatePage}>
                  {certificateData?.loading && !courseDetail?.previewMode ? (
                    <Space direction="vertical" className={styles.generating_loader}>
                      <SpinLoader className="lesson_loader" />

                      <p> Generating Certificate</p>
                    </Space>
                  ) : (
                    <>
                      {courseDetail?.previewMode ? (
                        <div className={styles.certificateBtn}>
                          <h1>You have successfully completed this course</h1>
                          <Link href={"/courses"} type="primary">
                            <Button type="primary">
                              Browse Courses
                              {SvgIcons.arrowRight}
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className={styles.certificateBtn}>
                          <h1>You have successfully completed this course</h1>
                          <Button
                            type="primary"
                            onClick={() => {
                              router.push(
                                `/courses/${router.query.slug}/certificate/${certificateData?.certificateId}`
                              );
                            }}
                          >
                            View Certificate
                            {SvgIcons.arrowRight}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {currentLesson?.lesson?.contentType === $Enums.ResourceContentType.Video && (
              <Tabs
                style={{
                  padding: "0 0 10px",
                  width: isMobile ? "100%" : getVideoPlayerWidth(),
                }}
                tabBarExtraContent={
                  <>
                    {!isMobile && courseDetail?.userRole === Role.STUDENT && (
                      <>
                        {currentLesson?.lesson ? (
                          <>
                            {currentLesson?.lesson?.isWatched && (
                              <Button>
                                <Flex gap={5}>{SvgIcons.check} Completed </Flex>
                              </Button>
                            )}
                            {!currentLesson?.lesson?.isWatched && (
                              <Button loading={markAsLoading} type="primary" onClick={onMarkAsCompleted}>
                                Mark as Completed
                              </Button>
                            )}
                          </>
                        ) : (
                          <Skeleton.Button />
                        )}
                      </>
                    )}
                  </>
                }
                onChange={(key) => {
                  setTabKey(key);
                }}
                tabBarGutter={40}
                defaultActiveKey={String(router.query.tab)}
                className={styles.add_course_tabs}
                items={isMobile ? responsiveItems : items}
              />
            )}
          </div>
          {!isMobile && (
            <>
              <LessonListSideBar menu={lessonMenuList} defaulSelectedKey={`${currentLesson?.lesson?.lessonId}`} />
            </>
          )}
        </section>
      ) : (
        <SpinLoader className="course__spinner" />
      )}
    </AppLayout>
  );
};

export default LessonPage;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { req, query } = ctx;
  const params = ctx?.params;
  let cookieName = getCookieName();
  const { site } = getSiteConfig();
  const user = await getToken({ req, secret: process.env.NEXT_PUBLIC_SECRET, cookieName });

  const courseInfo = await prisma.course.findUnique({
    where: {
      slug: String(query.slug),
    },
    select: {
      courseId: true,
    },
  });

  if (user && courseInfo) {
    const courseAuthor = await prisma?.course.findUnique({
      where: {
        courseId: courseInfo.courseId,
      },
      select: {
        authorId: true,
      },
    });
    const isEnrolled = await getUserEnrolledCoursesId(courseInfo?.courseId, user?.id);
    if (!isEnrolled && user.id !== courseAuthor?.authorId) {
      return {
        redirect: {
          permanent: false,
          message: "you are not enrolled in this course",
          destination: "/unauthorized?from=lesson",
        },
      };
    }
  }
  return {
    props: {
      siteConfig: site,
      courseId: Number(courseInfo?.courseId),
    },
  };
};
