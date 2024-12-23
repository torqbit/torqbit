import { FC, useEffect, useState } from "react";
import style from "@/styles/LearnLecture.module.scss";
import PurifyContent from "../../PurifyContent/PurifyContent";
import AssignmentService from "@/services/course/AssignmentService";
import { IAssignmentDetail } from "@/types/courses/Course";
import { Flex, message } from "antd";
import SpinLoader from "../../SpinLoader/SpinLoader";

const AssignmentContentTab: FC<{ lessonId?: number }> = ({ lessonId }) => {
  const [assignmentDetail, setAssignmentDetail] = useState<IAssignmentDetail>();
  const [loading, setLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const getAssignmentDetail = (lessonId: number) => {
    setLoading(true);
    AssignmentService.getAssignment(
      lessonId,
      (result) => {
        setAssignmentDetail(result.assignmentDetail);
        setLoading(false);
      },
      (error) => {
        messageApi.error(error);
        setLoading(false);
      }
    );
  };
  useEffect(() => {
    lessonId && getAssignmentDetail(lessonId);
  }, [lessonId]);
  return (
    <>
      {contextHolder}
      {loading ? (
        <Flex align="center" justify="center">
          <SpinLoader className="editor_spinner" />
        </Flex>
      ) : (
        <div className={style.editorWrapper}>
          <PurifyContent content={assignmentDetail?.content as string} />
        </div>
      )}
    </>
  );
};

export default AssignmentContentTab;
