import React, { FC, useEffect, useState } from "react";
import style from "@/styles/LearnLecture.module.scss";
import { TabsProps, Tabs, Flex } from "antd";
import QADiscssionTab from "../LearnCourse/AboutCourse/CourseDiscussion/CourseDiscussion";
import { capsToPascalCase } from "@/lib/utils";
import AssignmentService from "@/services/AssignmentService";
import { useRouter } from "next/router";
import appConstant from "@/services/appConstant";
import SvgIcons from "../SvgIcons";
import { Role, submissionStatus, SubmissionType } from "@prisma/client";
import { useMediaQuery } from "react-responsive";
import AssignmentSubmissionTab from "./Submissions/AssignmentSubmissionTab";
import AssignmentContentTab from "./Content/AssignmentContentTab";
import { useAppContext } from "../ContextApi/AppContext";

export type AssignmenTab = "view_assignment" | "submission" | "discussions";

const ViewAssignment: FC<{
  lessonId: number;
  discussionLoader: boolean;
  assignmentId: number;
  userRole: Role;
  ResponsiveLessonItemsList: JSX.Element;
  assignmentFiles: string[];
  submissionType: SubmissionType;
  updateAssignmentWatchedStatus: (chapterSeqId: number, lessonId: number) => void;
  chapterSeqId: number;
}> = ({
  lessonId,
  discussionLoader,
  assignmentId,
  userRole,
  ResponsiveLessonItemsList,
  assignmentFiles,
  submissionType,
  updateAssignmentWatchedStatus,
  chapterSeqId,
}) => {
  const isMax933Width = useMediaQuery({ query: "(max-width: 933px)" });
  const [tabKey, setTabKey] = useState<AssignmenTab>("view_assignment");
  const [subStatus, setSubStatus] = useState<submissionStatus>();
  const [score, setScore] = useState<number>();
  const [submitLimit, setSubmitLimit] = useState<number>(0);
  const { globalState } = useAppContext();
  const router = useRouter();

  const getLatestStatus = (assignmentId: number, lessonId: number, courseId: number) => {
    if (submitLimit === appConstant.assignmentSubmissionLimit && subStatus !== submissionStatus.PENDING) {
      return;
    }
    AssignmentService.getLatestSubmissionStatus(
      lessonId,
      assignmentId,

      courseId,
      (result) => {
        setSubStatus(result.latestSubmissionStatus);
        if (result.submitLimit) {
          setSubmitLimit(result.submitLimit);
        }

        if (result.score) {
          setScore(result.score);
        }
        if (
          result.submitLimit === appConstant.assignmentSubmissionLimit &&
          result.latestSubmissionStatus !== submissionStatus.PENDING
        ) {
          updateAssignmentWatchedStatus(chapterSeqId, lessonId);
        }
      },
      (error) => {
        console.log(error);
      }
    );
  };
  const onTabChange = (tab: string) => {
    setTabKey(tab as AssignmenTab);
  };

  const items: TabsProps["items"] = [
    {
      key: "view_assignment",
      label: `Assignment`,
      children: <AssignmentContentTab lessonId={tabKey === "view_assignment" ? lessonId : undefined} />,
    },
    {
      key: "submission",
      label: "Submission",
      children: (
        <AssignmentSubmissionTab
          lessonId={lessonId}
          assignmentId={tabKey === "submission" ? assignmentId : undefined}
          userRole={userRole}
          setSubStatus={setSubStatus}
          subStatus={subStatus as submissionStatus}
          setScore={setScore}
          assignmentFiles={assignmentFiles}
          submissionType={submissionType}
          getLatestStatus={getLatestStatus}
          setSubmitLimit={setSubmitLimit}
          submitLimit={submitLimit}
          onTabChange={onTabChange}
        />
      ),
    },
    {
      key: "discussions",
      label: "Discussions",
      children: (
        <div className={style.discussionWrapper}>
          <QADiscssionTab loading={discussionLoader} resourceId={tabKey === "discussions" ? lessonId : undefined} />
        </div>
      ),
    },
  ];

  const getStatusIcon = (status: submissionStatus) => {
    switch (status) {
      case submissionStatus.PENDING:
        return <i style={{ height: 18, color: "#faad14" }}> {SvgIcons.review}</i>;
      case submissionStatus.COMPLETED:
        return <i>{SvgIcons.checkFilled}</i>;
      case submissionStatus.FAILED:
        return <i>{SvgIcons.cross}</i>;
      case submissionStatus.PASSED:
        return <i>{SvgIcons.checkFilled}</i>;
      default:
        break;
    }
  };

  useEffect(() => {
    if (router.query.tab) {
      onTabChange(String(router.query.tab));
    }
    assignmentId && getLatestStatus(Number(assignmentId), Number(router.query.lessonId), Number(router.query.courseId));
  }, [assignmentId]);

  const getTabWidth = () => {
    if (globalState.collapsed && globalState.lessonCollapsed) {
      return "calc(100vw - 320px)";
    } else if (!globalState.collapsed && globalState.lessonCollapsed) {
      return "calc(100vw - 500px)";
    } else if (globalState.collapsed && !globalState.lessonCollapsed) {
      return "calc(100vw - 570px)";
    } else {
      return "calc(100vw - 750px)";
    }
  };

  return (
    <section className={style.view_submit_assignment}>
      <Tabs
        className={style.assignment_tab_container}
        style={{ width: isMax933Width ? "auto" : getTabWidth(), transition: "all .4s ease" }}
        onChange={(key) => {
          onTabChange(key);
          getLatestStatus(Number(assignmentId), Number(router.query.lessonId), Number(router.query.courseId));
        }}
        defaultActiveKey={"view_assignment"}
        activeKey={tabKey}
        tabBarExtraContent={
          subStatus ? (
            <Flex align="center" gap={10} className={style.scoreWrapper}>
              <div>
                {subStatus === submissionStatus.PENDING ? (
                  <Flex gap={5} align="center">
                    <i> {SvgIcons.review}</i>
                    <span> Review {capsToPascalCase(submissionStatus.PENDING)}</span>
                  </Flex>
                ) : (
                  <Flex gap={5} align="center">
                    <i>{getStatusIcon(subStatus)}</i>
                    <span>{capsToPascalCase(subStatus)} </span>
                  </Flex>
                )}
              </div>
              {subStatus !== submissionStatus.PENDING && (
                <>
                  <div className={style.dot}></div>

                  <div>
                    {score}/{appConstant.assignmentMaxScore} Points
                  </div>
                </>
              )}
            </Flex>
          ) : (
            ""
          )
        }
        tabBarStyle={{
          padding: "0px 0px 0px 5px",
          margin: 0,
          height: 40,
        }}
        items={
          isMax933Width
            ? [
                {
                  key: "lessons",
                  label: `Lessons`,
                  children: ResponsiveLessonItemsList,
                },
                ...items,
              ]
            : items
        }
      />
    </section>
  );
};

export default ViewAssignment;
