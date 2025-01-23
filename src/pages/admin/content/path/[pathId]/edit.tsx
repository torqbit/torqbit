import learningPath from "@/actions/learningPath";
import LearningPathForm from "@/components/Admin/LearningPath/LearningPathForm";
import AppLayout from "@/components/Layouts/AppLayout";
import { getSiteConfig } from "@/services/getSiteConfig";
import learningPathSerivices from "@/services/learningPath/LearningPathSerivices";
import { PageSiteConfig } from "@/services/siteConstant";
import { ILearningCourseList, ILearningPathDetail } from "@/types/learingPath";
import { StateType } from "@prisma/client";
import { Form, message } from "antd";

import { GetServerSidePropsContext, NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

const AddLearningPath: NextPage<{
  learningDetail: ILearningPathDetail;
  siteConfig: PageSiteConfig;
  courseList: ILearningCourseList[];
}> = ({ siteConfig, learningDetail, courseList }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [currentState, setCurrentState] = useState<StateType>(StateType.DRAFT);
  const router = useRouter();
  const onUpdate = (state: StateType, file?: File) => {
    if (!file) {
      messageApi.warning(`Learing path must have a banner`);
      return;
    }
    setLoading(true);
    const data = {
      title: form.getFieldsValue().title,
      courses: form.getFieldsValue().courses.map((opt: string) => {
        let findId = courseList.find((cl) => {
          return cl.name === opt;
        })?.courseId;
        if (findId) {
          return `${courseList.find((l) => l.name == opt)?.courseId}`;
        } else {
          return opt;
        }
      }),
      pathId: Number(router.query.pathId),
      state: state,
      description: form.getFieldsValue().description,
      banner: learningDetail.banner,
    };

    const formData = new FormData();
    formData.append("learingPath", JSON.stringify(data));
    file && formData.append("file", file);
    learningPathSerivices.update(
      formData,
      (result) => {
        messageApi.success(result.message);
        form.setFieldsValue({
          title: result.body?.title,
          description: result.body?.description,
          slug: result.body?.slug,
          banner: result.body?.banner,
        });
        result.body?.state && setCurrentState(result.body.state);
        setLoading(false);

        // router.push(`/admin/site/content/${contentType === "UPDATE" ? "updates" : "blogs"}`);
      },
      (error) => {
        messageApi.error(error);
        setLoading(false);
      }
    );
  };
  return (
    <AppLayout siteConfig={siteConfig}>
      {contextHolder}
      <LearningPathForm
        loading={loading}
        onSubmit={onUpdate}
        form={form}
        courseList={courseList}
        currentState={currentState}
        title="Update Learning Path"
        initialValue={{
          title: learningDetail.title,
          description: learningDetail.description,
          courses: learningDetail?.learningPathCourses.map((l) => `${l.name}`) || [],
          banner: learningDetail.banner,
        }}
      />{" "}
    </AppLayout>
  );
};
export default AddLearningPath;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { query } = ctx;
  const siteConfig = getSiteConfig();
  const { site } = siteConfig;
  const getCoursesList = await learningPath.getCoursesList();
  const getDetailResponse = await learningPath.getLearningDetail(Number(query.pathId));

  return {
    props: {
      siteConfig: site,
      courseList: getCoursesList.body || [],

      learningDetail: getDetailResponse && getDetailResponse.success ? getDetailResponse.body : undefined,
    },
  };
};
