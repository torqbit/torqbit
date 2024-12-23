import SpinLoader from "@/components/SpinLoader/SpinLoader";
import AssignmentService, { ISubmissionDetail } from "@/services/course/AssignmentService";
import { Breadcrumb, Button, Drawer, Flex, Form, InputNumber, message, Modal, Segmented, Space } from "antd";
import { GetServerSidePropsContext, NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import style from "@/styles/AssignmentEvaluation.module.scss";
import TextEditor from "@/components/Editor/Quilljs/Editor";
import appConstant from "@/services/appConstant";
import { SegmentedValue } from "antd/es/segmented";
import { countAlphabets, getCookieName, mapToArray, replaceEmptyParagraphs } from "@/lib/utils";
import PreviewAssignment from "@/components/Assignment/Submissions/PreviewAssignment";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { useAppContext } from "@/components/ContextApi/AppContext";
import ViewResult from "@/components/Assignment/Submissions/ViewResult";
import AssignmentCodeEditor from "@/components/Assignment/Submissions/AssignmentCodeEditor";
import { submissionStatus } from "@prisma/client";
import AppLayout from "@/components/Layouts/AppLayout";
import { PageSiteConfig } from "@/services/siteConstant";
import { getSiteConfig } from "@/services/getSiteConfig";

const EvaluatePage: NextPage<{ siteConfig: PageSiteConfig }> = ({ siteConfig }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [evaluationLoading, setEvaluationLoading] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const router = useRouter();
  const [submissionDetail, setSubmissionDetail] = useState<ISubmissionDetail>();
  const [messageApi, contextHolder] = message.useMessage();
  const [editorValue, setEditorValue] = useState<string>("");
  const [form] = Form.useForm();
  const [open, setOpen] = useState<boolean>(false);
  const [refresh, SetRefresh] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedsegment, setSelectedSegment] = useState<SegmentedValue>("Code");

  const { globalState } = useAppContext();

  const getSubmissionDetail = () => {
    setLoading(true);
    try {
      AssignmentService.getSubmissionDetail(
        Number(router.query.id),
        (result) => {
          let content = result.submissionDetail.content;

          setSubmissionDetail({
            assignmentFiles: result.submissionDetail.assignmentFiles,
            content: new Map<string, string>(content),
            assignmentId: result.submissionDetail.assignmentId,
            isEvaluated: result.submissionDetail.isEvaluated,
            score: result.submissionDetail.score,
            comment: result.submissionDetail.comment,
            lessonId: result.submissionDetail.lessonId,
            assignmentName: result.submissionDetail.assignmentName,
          });
          setLoading(false);
        },
        (error) => {
          messageApi.error(error);
          setLoading(false);
        }
      );
    } catch (error: any) {
      messageApi.error(error);
      setLoading(false);
    }
  };
  const evaluateSubmission = () => {
    setEvaluationLoading(true);
    if (!editorValue) {
      setEvaluationLoading(false);
      messageApi.warning("Add a comment first");
      return;
    }
    let detail = {
      assignmentId: Number(submissionDetail?.assignmentId),
      submissionId: Number(router.query.id),
      score: Number(form.getFieldsValue().score),
      comment: replaceEmptyParagraphs(editorValue),
    };
    AssignmentService.createEvaluation(
      detail,
      (result) => {
        messageApi.success(result.message);
        form.resetFields();
        setOpen(false);
        setEvaluationLoading(false);
        SetRefresh(!refresh);
      },
      (error) => {
        console.log(error);
        messageApi.error(error);
        setEvaluationLoading(false);
      }
    );
  };

  const handleAssignmentFiles = (value: SegmentedValue) => {
    if (value === "Preview") {
      const arrayMap = mapToArray(submissionDetail?.content as Map<string, string>);

      AssignmentService.previewAssignment(
        arrayMap,
        Number(router.query.courseId),
        Number(submissionDetail?.lessonId),
        (result) => {
          setPreviewUrl(result.preview);
          setSelectedSegment(value);
        },
        (error) => {
          messageApi.error(error);
        }
      );
    } else {
      setSelectedSegment(value);
    }
  };

  useEffect(() => {
    if (router.query.id) {
      getSubmissionDetail();
    }
  }, [router.query.id, refresh]);
  return (
    <AppLayout siteConfig={siteConfig}>
      {contextHolder}
      {!loading ? (
        <section className={style.evaluationWrapper}>
          <Breadcrumb
            className={style.breadcrumb}
            items={[
              {
                title: <Link href={`/admin/content`}>admin</Link>,
              },
              {
                title: <Link href={`/admin/content`}>content</Link>,
              },
              {
                title: "Submission",
              },
              {
                title: `${submissionDetail?.assignmentName}`,
              },
              {
                title: `${submissionDetail?.score && submissionDetail?.score > 0 ? "result" : "evaluate"}`,
              },
            ]}
          />
          <Space direction="vertical">
            <Flex align="center" justify="space-between">
              <Segmented
                className={style.Segmented_wrapper}
                options={["Code", "Preview"]}
                onChange={(value) => {
                  handleAssignmentFiles(value);
                }}
              />
              <>
                {submissionDetail?.isEvaluated ? (
                  <Button onClick={() => setDrawerOpen(true)} type="primary">
                    View Result
                  </Button>
                ) : (
                  <Button onClick={() => setOpen(true)} type="primary">
                    Evaluate
                  </Button>
                )}
              </>
            </Flex>
            <>
              {selectedsegment === "Code" ? (
                <>
                  {submissionDetail?.assignmentFiles &&
                    submissionDetail.assignmentFiles.length > 0 &&
                    submissionDetail.content && (
                      <AssignmentCodeEditor
                        assignmentFiles={submissionDetail?.assignmentFiles as string[]}
                        fileMap={submissionDetail?.content as Map<string, string>}
                        updateAssignmentMap={() => { }}
                        readOnly={true}
                      />
                    )}
                </>
              ) : (
                <div className={globalState.collapsed ? style.preview_collapsed_wrapper : style.preview_wrapper}>
                  <PreviewAssignment
                    previewUrl={previewUrl}
                    width={globalState.collapsed ? "calc(100vw - 550px)" : "calc(100vw - 750px)"}
                  />
                </div>
              )}
            </>
          </Space>
          <Modal
            maskClosable={false}
            open={open}
            onCancel={() => setOpen(false)}
            onOk={form.submit}
            okButtonProps={{
              disabled: !form.getFieldsValue().score || countAlphabets(replaceEmptyParagraphs(editorValue)) === 0,
            }}
            confirmLoading={evaluationLoading}
          >
            <Form layout="vertical" form={form} onFinish={evaluateSubmission}>
              <Form.Item
                name="score"
                label="Add Score"
                rules={[
                  { required: true, message: "Add a score" },
                  {
                    type: "number",
                    min: appConstant.assignmentMinScore,
                    max: appConstant.assignmentMaxScore,
                    message: "Invalid score",
                  },
                ]}
              >
                <InputNumber style={{ width: 300 }} placeholder="Input score" />
              </Form.Item>
              <TextEditor
                defaultValue={String(editorValue)}
                handleDefaultValue={setEditorValue}
                readOnly={false}
                theme="snow"
                placeholder="Evaluation Comment"
              />
            </Form>
          </Modal>
          <ViewResult
            score={Number(submissionDetail?.score)}
            comment={String(submissionDetail?.comment)}
            drawerOpen={drawerOpen}
            setDrawerOpen={setDrawerOpen}
          />
        </section>
      ) : (
        <SpinLoader />
      )}
    </AppLayout>
  );
};

export default EvaluatePage;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { req } = ctx;
  const params = ctx?.params;
  const { site } = getSiteConfig();
  let cookieName = getCookieName();

  const user = await getToken({ req, secret: process.env.NEXT_PUBLIC_SECRET, cookieName });

  const findAuthor = await prisma?.assignmentSubmission.findUnique({
    where: {
      id: Number(params?.id),
      NOT: {
        status: submissionStatus.NOT_SUBMITTED,
      },
    },
    select: {
      assignment: {
        select: {
          lesson: {
            select: {
              chapter: {
                select: {
                  course: {
                    select: {
                      authorId: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (user?.id === findAuthor?.assignment.lesson.chapter.course.authorId) {
    return {
      props: {
        siteConfig: site,
      },
    };
  } else {
    return {
      redirect: {
        permanent: false,

        destination: "/admin/content",
      },
    };
  }
};
