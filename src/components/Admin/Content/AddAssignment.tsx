import {
  Button,
  Col,
  Drawer,
  Flex,
  Form,
  FormInstance,
  Input,
  InputNumber,
  message,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Steps,
  Tag,
  Upload,
  UploadProps,
} from "antd";
import styles from "@/styles/AddAssignment.module.scss";
import { FC, useEffect, useState } from "react";
import AssignmentService from "@/services/course/AssignmentService";
import { ResourceContentType } from "@prisma/client";
import { CloseOutlined } from "@ant-design/icons";
import { useAppContext } from "@/components/ContextApi/AppContext";
import {
  IAssignmentDetails,
  IProgrammingLangSubmission,
  IProgrammingProjectSubmission,
  AssignmentType,
  MultipleChoiceQA,
  MCQAssignment,
} from "@/types/courses/assignment";
import ConfigFormLayout from "@/components/Configuration/ConfigFormLayout";
import ConfigForm from "@/components/Configuration/ConfigForm";
import MCQForm from "./MCQForm/MCQForm";
import FormDisableOverlay from "@/components/Configuration/FormDisableOverlay";

const AssignmentTypeOptions = [
  {
    title: "Multiple Choice",
    description: "Single or multiple correct answers",
    value: AssignmentType.MCQ,
    disabled: false,
  },
  {
    title: "Subjective",
    description: "Free text answers with option to upload attachments",
    value: AssignmentType.SUBJECTIVE,
    disabled: false,
  },
  {
    title: "Program",
    description: "General purpose programming in languages line C, Java, Python etc.",
    value: AssignmentType.PROGRAMMING_LANG,
    disabled: true,
  },
  {
    title: "Project",
    description: "Support for static website, React and Nextjs and other frameworks coming soon",
    value: AssignmentType.PROGRAMMING_PROJECT,
    disabled: true,
  },
];

export const createEmptyQuestion = (id: string): MultipleChoiceQA => ({
  id,
  title: "",
  description: "",
  options: [
    { key: "A", text: "" },
    { key: "B", text: "" },
  ],
  correctOptionIndex: [],
  answerExplaination: "",
});

const AddAssignment: FC<{
  setResourceDrawer: (value: boolean) => void;
  isEdit: boolean;
  currResId: number;
  contentType: ResourceContentType;
  showResourceDrawer: boolean;
  onRefresh: () => void;
  onDeleteResource: (id: number) => void;
  setEdit: (value: boolean) => void;
}> = ({
  setResourceDrawer,
  contentType,
  onRefresh,
  currResId,
  setEdit,
  isEdit,
  showResourceDrawer,
  onDeleteResource,
}) => {
  const [assignmentForm] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [editorValue, setDefaultValue] = useState<string>();
  const [submissionType, setSubmissionType] = useState<AssignmentType>();
  const [programmingLang, setProgrammingLang] = useState<string>("");
  const [questions, setQuestions] = useState<MultipleChoiceQA[]>([createEmptyQuestion("1")]);
  const [archiveUrl, setArchiveUrl] = useState<string>("");
  const [initialCode, setInitialCode] = useState<string>("");
  const [current, setCurrent] = useState<number>(0);
  const { globalState } = useAppContext();
  const handleAssignment = () => {
    if (!submissionType) return message.error("Please select assignment type");
    if (
      submissionType === AssignmentType.MCQ &&
      questions.length > 0 &&
      questions[0].title === "" &&
      questions[0].options[0].text === "" &&
      questions[0].options[1].text === ""
    ) {
      return message.error("Please complete the questions");
    }
    setLoading(true);
    let progAssignment: IAssignmentDetails;

    // Base object with `_type` for all cases
    const baseAssignment = { _type: submissionType };

    switch (submissionType) {
      case AssignmentType.MCQ:
        progAssignment = {
          ...baseAssignment,
          questions: questions,
        } as MCQAssignment;
        break;

      case AssignmentType.PROGRAMMING_PROJECT: {
        const { projectFramework, archiveUrl: projectArchiveUrl } = assignmentForm.getFieldsValue();
        setArchiveUrl(projectArchiveUrl);
        progAssignment = {
          ...baseAssignment,
          framework: projectFramework,
          baseProjectArchiveUrl: archiveUrl,
        } as IProgrammingProjectSubmission;
        break;
      }

      default:
        progAssignment = { ...baseAssignment } as IAssignmentDetails;
        break;
    }

    AssignmentService.createAssignment(
      {
        lessonId: Number(currResId),
        title: assignmentForm.getFieldsValue().title,
        estimatedDurationInMins: assignmentForm.getFieldsValue().estimatedDurationInMins ?? 30,
        maximumScore: Number(assignmentForm.getFieldsValue().maximumScore),
        passingScore: Number(assignmentForm.getFieldsValue().passingScore),
        isEdit,
        details: progAssignment,
      },
      (result) => {
        onClose(false);
        message.success(result.message);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        message.error(error);
      }
    );
    setLoading(false);
  };

  useEffect(() => {
    if (isEdit) {
      AssignmentService.getAssignment(
        currResId,
        (result) => {
          assignmentForm.setFieldValue("title", result.assignmentDetail.name);
          assignmentForm.setFieldValue("estimatedDurationInMins", result.assignmentDetail.estimatedDurationInMins);
          assignmentForm.setFieldValue("assignmentType", result.assignmentDetail.content._type);
          setSubmissionType(result.assignmentDetail.content._type);

          switch (result.assignmentDetail.content._type) {
            case AssignmentType.MCQ:
              const content = result.assignmentDetail.content as MCQAssignment;
              setQuestions(content.questions);
              setCurrent(1);
              break;
            case AssignmentType.PROGRAMMING_PROJECT:
              const submissionConf2 = result.assignmentDetail.content as IProgrammingProjectSubmission;
              assignmentForm.setFieldValue("projectFramework", submissionConf2.framework);
              assignmentForm.setFieldValue("archiveUrl", submissionConf2.baseProjectArchiveUrl);
              setArchiveUrl(submissionConf2.baseProjectArchiveUrl);
              break;

            default:
              break;
          }

          if (result.assignmentDetail.maximumScore || result.assignmentDetail.passingScore) {
            assignmentForm.setFieldValue("maximumScore", result.assignmentDetail.maximumScore);
            assignmentForm.setFieldValue("passingScore", result.assignmentDetail.passingScore);
            setCurrent(2);
          }
        },
        (error) => {}
      );
    }
  }, [currResId, isEdit]);

  useEffect(() => {
    if (
      questions.length > 0 &&
      questions[0].title !== "" &&
      questions[0].options[0].text !== "" &&
      questions[0].options[1].text !== ""
    ) {
      setCurrent(2);
    }
  }, [questions]);

  const onClose = (closeDrawer: boolean) => {
    if (closeDrawer) {
      currResId && !isEdit && onDeleteResource(currResId);
    }
    setResourceDrawer(false);
    assignmentForm.resetFields();
    setQuestions([createEmptyQuestion("1")]);
    setInitialCode("");
    setCurrent(0);
    setDefaultValue("");
    setSubmissionType(undefined);
    setArchiveUrl("");
    onRefresh();
  };

  const onDeleteArchive = () => {
    AssignmentService.deleteAssignmentArchive(
      archiveUrl,
      (result) => {
        message.success(result.message);
        setArchiveUrl("");
        assignmentForm.setFieldValue("archiveUrl", "");
      },
      (error) => {
        message.error(error);
      }
    );
  };

  return (
    <Drawer
      classNames={{ header: styles.headerWrapper, body: styles.body, footer: `${styles.footer} add_assignment_footer` }}
      width={"55vw"}
      maskClosable={false}
      closeIcon={false}
      className={styles.newResDetails}
      title={
        <div className={styles.drawerHeader}>
          <Space className={styles.drawerTitle}>
            <CloseOutlined
              onClick={() => {
                onClose(true);

                setEdit(false);
              }}
            />
            {isEdit ? `Update ${contentType} Details` : `New ${contentType} Details`}
          </Space>
        </div>
      }
      placement="right"
      open={showResourceDrawer}
      footer={
        <Space className={styles.footerBtn}>
          <Button
            loading={loading}
            onClick={() => {
              handleAssignment();
              assignmentForm.submit();
            }}
            type="primary"
          >
            {isEdit ? "Update" : "Save Lesson"}
          </Button>
          <Button
            type="default"
            onClick={() => {
              onClose(true);
              setEdit(false);
            }}
          >
            Cancel
          </Button>
        </Space>
      }
    >
      <Steps
        current={current}
        status="finish"
        size="small"
        progressDot
        direction="vertical"
        className={styles.ant_steps}
        items={[
          {
            title: (
              <ConfigFormLayout formTitle={"Configure Assignment Type"} width="100%">
                <Form form={assignmentForm} initialValues={{ estimatedDurationInMins: 30 }}>
                  <ConfigForm
                    title="Assignment Title"
                    description="Enter the title of the assignment"
                    input={
                      <Form.Item name="title">
                        <Input placeholder="Enter the title of the assignment" />
                      </Form.Item>
                    }
                  />

                  <ConfigForm
                    title="Estimated Duration"
                    description="Enter the estimated duration in minutes"
                    input={
                      <Form.Item name="estimatedDurationInMins">
                        <InputNumber placeholder="" defaultValue={30} />
                      </Form.Item>
                    }
                  />
                  <ConfigForm
                    input={
                      <Form.Item name="assignmentType">
                        <Radio.Group>
                          <Row gutter={[16, 16]}>
                            {AssignmentTypeOptions.map((item) => (
                              <Col span={12}>
                                <Radio
                                  key={item.value}
                                  value={item.value}
                                  disabled={item.disabled}
                                  onChange={(e) => {
                                    setSubmissionType(e.target.value);
                                    if (current === 0) setCurrent(1);
                                  }}
                                  className={`assignment_type_radio ${styles.assignment_type_radio}`}
                                >
                                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                                    <h5>{item.title}</h5>
                                    {item.disabled && <Tag color="orange">upcoming</Tag>}
                                  </Space>
                                  <p>{item.description}</p>
                                </Radio>
                              </Col>
                            ))}
                          </Row>
                        </Radio.Group>
                      </Form.Item>
                    }
                    title={"Assignment Type"}
                    description={
                      "Chose what kind of assignnment you want to give in order to assess the skills of the student "
                    }
                    divider={false}
                  />
                </Form>
              </ConfigFormLayout>
            ),
          },

          {
            title: (
              <ConfigFormLayout formTitle={"Multiple choice question"} width="100%">
                <p>
                  Provide the list of questions that will be presented to the learners for completing this assignment
                </p>
                <MCQForm questions={questions} setQuestions={setQuestions} />
                {current < 1 && <FormDisableOverlay message="First complete the previous step" />}
              </ConfigFormLayout>
            ),
          },
          {
            title: (
              <ConfigFormLayout formTitle={"Setup Grading"} width="100%">
                <Form form={assignmentForm} initialValues={{ maximumScore: 5, passingScore: 80 }}>
                  <ConfigForm
                    input={
                      <Form.Item name="maximumScore">
                        <Input addonAfter="points" type="number" defaultValue="5" />
                      </Form.Item>
                    }
                    title={"Maximum Scores"}
                    description={"This is the max score for the assignment, that will be based on multiple parameters "}
                    divider={false}
                  />
                  <ConfigForm
                    input={
                      <Form.Item name="passingScore">
                        <Input addonAfter="%" type="number" defaultValue="80" />
                      </Form.Item>
                    }
                    title={"Passing Scores"}
                    description={"Setup the passing percentage for this assignment"}
                    divider={false}
                  />
                </Form>
                {current < 2 && <FormDisableOverlay message="First complete the previous step" />}
              </ConfigFormLayout>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default AddAssignment;
