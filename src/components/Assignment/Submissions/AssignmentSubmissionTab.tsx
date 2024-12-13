import appConstant from "@/services/appConstant";
import { Button, Flex, message, Select, Space, Segmented } from "antd";
import { SegmentedValue } from "antd/es/segmented";
import { FC, useEffect, useState } from "react";
import style from "@/styles/LearnLecture.module.scss";
import { useMediaQuery } from "react-responsive";
import { useAppContext } from "../../ContextApi/AppContext";
import { Role, submissionStatus, SubmissionType } from "@prisma/client";
import AssignmentService, { IAllSubmmissionsDetail } from "@/services/AssignmentService";
import { arrangeAssignmentFiles, compareByHash, getCodeDefaultValue, getExtension, mapToArray } from "@/lib/utils";
import { useRouter } from "next/router";
import SpinLoader from "@/components/SpinLoader/SpinLoader";
import SvgIcons from "@/components/SvgIcons";
import { CaretDownOutlined } from "@ant-design/icons";
import CodeEditorSubmission from "./CodeEditorSubmission";
import TextEditorSubmission from "./TextEditorSubmission";

const AssignmentSubmissionTab: FC<{
  userRole: Role;
  assignmentId?: number;
  lessonId: number;
  setSubStatus: (value: submissionStatus) => void;
  subStatus: submissionStatus;
  setScore: (value: number) => void;
  assignmentFiles: string[];
  submissionType: SubmissionType;
  getLatestStatus: (assignmentId: number, lessonId: number, courseId: number) => void;
  setSubmitLimit: (value: number) => void;
  submitLimit: number;
  onTabChange: (tab: string) => void;
}> = ({
  userRole,
  assignmentId,
  lessonId,
  subStatus,
  setSubStatus,
  setScore,
  assignmentFiles,
  submissionType,
  getLatestStatus,
  setSubmitLimit,
  submitLimit,
  onTabChange,
}) => {
  const isMobile = useMediaQuery({ query: "(max-width: 1200px)" });
  const [selectedsegment, setSelectedSegment] = useState<SegmentedValue>("Code");
  const [fileMap, setFileMap] = useState<Map<string, string>>(new Map());
  const [previousData, setPreviousData] = useState<Map<string, string>>(new Map());
  const [savedData, setSavedData] = useState<Map<string, string>>(new Map());
  const [submitDisable, setSubmitDisable] = useState<boolean>(true);
  const [allSubmmissionsDetail, setSubmissionDetail] = useState<IAllSubmmissionsDetail[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [evaluationLoading, setEvaluationLoading] = useState<boolean>(false);
  const [previewHistory, setPreviewHistory] = useState<boolean>(false);
  const { globalState } = useAppContext();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const updateAssignmentMap = (fileName: string, newValue: string) => {
    setFileMap((prevMap) => {
      const newMap = new Map(prevMap);
      if (newMap.has(fileName)) {
        newMap.set(fileName, newValue);
      } else {
        console.warn(`Key ${fileName} does not exist.`);
      }
      previousData && setSubmitDisable(compareByHash(mapToArray(previousData), mapToArray(newMap)));

      return newMap;
    });
  };
  const createAssignmentMap = () => {
    if (assignmentFiles.length > 0 && submissionType === SubmissionType.TEXT_EDITOR) {
      let path = "";
      assignmentFiles.forEach((f) => {
        if (f.includes(".css")) {
          path = f;
        }
      });

      arrangeAssignmentFiles(assignmentFiles).map((assign, i) => {
        fileMap.set(assign, getCodeDefaultValue(getExtension(assign), path) as string);
      });
      setTimeout(() => {}, 3000);
    } else if (submissionType === SubmissionType.CODE_EDITOR) {
      fileMap.set("article", "Dummy Text");
    }
  };

  const saveAssignment = (assignmentId: number) => {
    if (compareByHash(mapToArray(fileMap), mapToArray(savedData))) {
      return;
    }

    setSaveLoading(true);
    try {
      const content = Object.fromEntries(fileMap.entries());
      let submitData = {
        content: JSON.stringify(content),
        lessonId: lessonId,
        courseId: Number(router.query.courseId),
        assignmentId: assignmentId,
      };
      AssignmentService.saveAssignment(
        submitData,
        (result) => {
          messageApi.success({ content: result.message });
          setSaveLoading(false);
          //   setRefresh(!refresh);
        },
        (error) => {
          messageApi.error({ content: error });
          setSaveLoading(false);
        }
      );
    } catch (error: any) {
      setSaveLoading(false);

      messageApi.error({
        content: error,
      });
    }
  };

  const getSubmissionHistoryDetail = (assignmentId: number, lessonId: number, courseId: number) => {
    setEvaluationLoading(true);
    AssignmentService.getSubmissionHistory(
      lessonId,
      assignmentId,

      courseId,
      (result) => {
        setSubmissionDetail(result.allSubmmissions);
        if (result.latestSubmissionStatus) {
          if (result.allSubmmissions[0].evaluated) {
            let maxScore = result.allSubmmissions.sort((a, b) => Number(b.score) - Number(a.score))[0].score;
            setScore(Number(maxScore));
          }
        }
        setEvaluationLoading(false);
      },
      (error) => {
        messageApi.error(error);
        setEvaluationLoading(false);
      }
    );
    setPreviewHistory(false);
  };

  const submitAssignment = (assignmentId: number) => {
    setSubmitLoading(true);
    try {
      const content = Object.fromEntries(fileMap.entries());

      let submitData = {
        content: JSON.stringify(content),
        lessonId: lessonId,
        courseId: Number(router.query.courseId),
        assignmentId: assignmentId,
      };
      AssignmentService.submitAssignment(
        submitData,
        (result) => {
          messageApi.success({ content: result.message });

          setSubmitLimit(result.totalSubmissions);
          setSubmitLoading(false);
          setSubmitDisable(true);
          checkTotalSubmission(Number(assignmentId), Number(router.query.lessonId), Number(router.query.courseId));
        },
        (error) => {
          messageApi.error({ content: error });
          setSubmitLoading(false);
        }
      );
    } catch (error: any) {
      setSubmitLoading(false);
      messageApi.error({
        content: error,
      });
    }
  };

  const getSubmissionHistoryLabel = (i: number) => {
    if (i === 0) {
      return "1st attempt";
    } else if (i === 1) {
      return "2nd attempt";
    } else {
      return "3rd attempt";
    }
  };

  const showHistory = (submissionId: number) => {
    setPreviewHistory(submissionId ? true : false);
    const findSubmission = allSubmmissionsDetail.find((f) => f.submissionId === submissionId);
    setFileMap(new Map<string, string>(findSubmission?.content));
  };

  const checkTotalSubmission = (assignmentId: number, lessonId: number, courseId: number) => {
    setLoading(true);
    AssignmentService.checkSubmissions(
      assignmentId,
      lessonId,
      courseId,
      (result) => {
        if (result.latestSubmissionDetail.savedContent) {
          setFileMap(new Map<string, string>(result.latestSubmissionDetail.savedContent));
          setSavedData(new Map<string, string>(result.latestSubmissionDetail.savedContent));
          if (result.latestSubmissionDetail.previousContent) {
            setPreviousData(new Map<string, string>(result.latestSubmissionDetail.previousContent));
          }
        } else {
          createAssignmentMap();
        }

        setSubStatus(result.latestSubmissionDetail.status as submissionStatus);
        if (
          result.latestSubmissionDetail.status &&
          result.latestSubmissionDetail.status !== submissionStatus.NOT_SUBMITTED
        ) {
          setSubmitLimit(Number(result.latestSubmissionDetail.submitLimit));
          setScore(result.latestSubmissionDetail.score);
          getSubmissionHistoryDetail(
            Number(assignmentId),
            Number(router.query.lessonId),
            Number(router.query.courseId)
          );
        } else {
          setSubmitLimit(0);
        }

        setLoading(false);
      },
      (error) => {
        messageApi.error(error);
        setLoading(false);
      }
    );
    setPreviewHistory(false);
  };

  useEffect(() => {
    if (assignmentId) {
      if (router.query.tab) {
        onTabChange(String(router.query.tab));
        if (router.query.segment) {
          if (router.query.segment === "evaluations") {
            setSelectedSegment("Evaluations" as SegmentedValue);
          }
        }
      }
      if (fileMap.size > 0) {
        fileMap.clear();
      }
      if (!router.query.segment) {
        setSelectedSegment("Code");
      }
      checkTotalSubmission(Number(assignmentId), Number(router.query.lessonId), Number(router.query.courseId));
    }
  }, [assignmentId]);

  const handleAssignmentFiles = (value: SegmentedValue) => {
    if (value === "Preview") {
      const arrayMap = mapToArray(fileMap);

      AssignmentService.previewAssignment(
        arrayMap,
        Number(router.query.courseId),
        lessonId,
        (result) => {
          setPreviewUrl(result.preview);
          setSelectedSegment(value);
        },
        (error) => {
          messageApi.error(error);
        }
      );
    } else if (value === "Evaluations") {
      getSubmissionHistoryDetail(Number(assignmentId), Number(router.query.lessonId), Number(router.query.courseId));
      setSelectedSegment(value);
    } else if (value === "Code") {
      checkTotalSubmission(Number(assignmentId), Number(router.query.lessonId), Number(router.query.courseId));

      setSelectedSegment(value);
    }
    getLatestStatus(Number(assignmentId), lessonId, Number(router.query.courseId));
  };
  console.log(fileMap);
  return (
    <>
      {contextHolder}

      {loading ? (
        <>
          <Flex align="center" justify="center">
            <SpinLoader className="editor_spinner" />
          </Flex>
        </>
      ) : (
        <>
          {isMobile ? (
            <Flex style={{ height: "50vh" }} align="center" justify="center">
              <h1>Access this from your Desktop or PC</h1>
            </Flex>
          ) : (
            <Space
              direction="vertical"
              className={globalState.collapsed ? style.code__collapsed__editor__wrapper : style.code__editor__wrapper}
            >
              <Flex align="center" justify="space-between">
                {submissionType === SubmissionType.CODE_EDITOR && (
                  <Segmented
                    value={selectedsegment}
                    className={`${style.Segmented_wrapper} segment__wrapper`}
                    options={["Code", "Preview", "Evaluations"]}
                    onChange={(value) => {
                      handleAssignmentFiles(value);
                    }}
                  />
                )}
                {/* userRole === Role.STUDENT && selectedsegment === "Code"  */}
                {/* {userRole === Role.STUDENT &&
                  (selectedsegment === "Code" || submissionType === SubmissionType.TEXT_EDITOR) && ( */}
                {userRole === Role.STUDENT &&
                  (selectedsegment === "Code" || submissionType === SubmissionType.TEXT_EDITOR) && (
                    <Flex align="center" gap={10}>
                      <Flex align="cneter" gap={0}>
                        <Button
                          style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: "none" }}
                          loading={saveLoading}
                          disabled={previewHistory || compareByHash(mapToArray(fileMap), mapToArray(savedData))}
                          onClick={() => {
                            saveAssignment(Number(assignmentId));
                          }}
                        >
                          Save
                        </Button>
                        <Select
                          suffixIcon={<CaretDownOutlined className={style.selectIcon} />}
                          className={"select_history"}
                          style={{ width: 145 }}
                          allowClear={{ clearIcon: <i className={style.selectClearIcon}>{SvgIcons.cross}</i> }}
                          placeholder="View Attempts"
                          onClear={() => {
                            subStatus !== submissionStatus.PENDING && setSubmitDisable(false);
                            checkTotalSubmission(
                              Number(assignmentId),
                              Number(router.query.lessonId),
                              Number(router.query.courseId)
                            );
                          }}
                          onChange={showHistory}
                        >
                          {allSubmmissionsDetail
                            .sort((a, b) => a.submissionId - b.submissionId)
                            .map((sub, i) => {
                              return (
                                <Select.Option key={i} value={sub.submissionId}>
                                  {getSubmissionHistoryLabel(i)}
                                </Select.Option>
                              );
                            })}
                        </Select>
                      </Flex>

                      {submitLimit < appConstant.assignmentSubmissionLimit && (
                        <Button
                          loading={submitLoading}
                          disabled={
                            submitLimit === appConstant.assignmentSubmissionLimit ||
                            (submitDisable && submitLimit > 0) ||
                            subStatus === submissionStatus.PENDING
                          }
                          onClick={() => submitAssignment(Number(assignmentId))}
                          type="primary"
                        >
                          Submit
                        </Button>
                      )}
                    </Flex>
                  )}
              </Flex>
              {submissionType === SubmissionType.CODE_EDITOR && (
                <CodeEditorSubmission
                  previewUrl={previewUrl}
                  selectedsegment={selectedsegment}
                  previewHistory={previewHistory}
                  evaluationLoading={evaluationLoading}
                  allSubmmissionsDetail={allSubmmissionsDetail}
                  fileMap={fileMap}
                  assignmentFiles={assignmentFiles}
                  assignmentId={assignmentId}
                  lessonId={lessonId}
                  saveAssignment={saveAssignment}
                  updateAssignmentMap={updateAssignmentMap}
                />
              )}
              {submissionType === SubmissionType.TEXT_EDITOR && (
                <TextEditorSubmission
                  textEditorValue={fileMap.get("article") as string}
                  setDefaultValue={(value) => updateAssignmentMap("article", value)}
                />
              )}
            </Space>
          )}
        </>
      )}
    </>
  );
};

export default AssignmentSubmissionTab;
