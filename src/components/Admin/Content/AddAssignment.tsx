import { Button, Drawer, Form, FormInstance, Input, InputNumber, message, Select, Space } from "antd";
import styles from "@/styles/AddAssignment.module.scss";
import appConstant from "@/services/appConstant";
import TextEditor from "@/components/Editor/Quilljs/Editor";
import { FC, useEffect, useState } from "react";
import AssignmentService from "@/services/AssignmentService";
import { ResourceContentType, SubmissionType } from "@prisma/client";
import { CloseOutlined } from "@ant-design/icons";

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
  const [editorValue, setDefaultValue] = useState<string>();
  const [assType, setAssType] = useState<SubmissionType>();
  const handleAssignment = () => {
    AssignmentService.createAssignment(
      {
        lessonId: Number(currResId),
        assignmentFiles: assignmentForm.getFieldsValue().assignmentFiles,
        submissionType: assignmentForm.getFieldsValue().submissionType,
        title: assignmentForm.getFieldsValue().title,
        content: editorValue,
        isEdit,
        estimatedDuration: assignmentForm.getFieldsValue().estimatedDuration,
      },
      (result) => {
        onClose(false);
        message.success(result.message);
      },
      (error) => {
        message.error(error);
      }
    );
  };

  useEffect(() => {
    if (isEdit) {
      AssignmentService.getAssignment(
        currResId,
        (result) => {
          assignmentForm.setFieldValue("title", result.assignmentDetail.name);
          assignmentForm.setFieldValue("submissionType", result.assignmentDetail.submissionType);
          setAssType(result.assignmentDetail.submissionType);
          assignmentForm.setFieldValue("assignmentFiles", result.assignmentDetail.assignmentFiles);
          assignmentForm.setFieldValue("estimatedDuration", result.assignmentDetail.estimatedDuration);

          setDefaultValue(result.assignmentDetail.content as string);
        },
        (error) => {}
      );
    }
  }, [currResId, isEdit]);

  const onClose = (closeDrawer: boolean) => {
    if (closeDrawer) {
      currResId && !isEdit && onDeleteResource(currResId);
    }
    setResourceDrawer(false);
    assignmentForm.resetFields();

    setDefaultValue("");
    onRefresh();
  };

  return (
    <Drawer
      classNames={{ header: styles.headerWrapper, body: styles.body, footer: `${styles.footer} add_assignment_footer` }}
      width={"50vw"}
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
          <Button onClick={() => assignmentForm.submit()} type="primary">
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
      <Form form={assignmentForm} onFinish={handleAssignment} layout="vertical">
        <Form.Item name="title" label="Title" rules={[{ required: true, message: "Please Enter Title" }]}>
          <Input placeholder="Add a title" />
        </Form.Item>
        <Form.Item
          name="submissionType"
          label="Submission Type"
          rules={[{ required: true, message: "Please Select Type" }]}
        >
          <Select placeholder="Select assignment type" onSelect={setAssType}>
            {appConstant.assignmentTypes.map((type, i) => {
              return (
                <Select.Option key={i} value={`${type}`}>
                  {type?.replace("_", " ")}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        {assType === appConstant.assignmentTypes[0] && (
          <Form.Item
            name="assignmentFiles"
            label="Assignment Files"
            rules={[{ required: true, message: "Please Select files" }]}
          >
            <Select mode="tags" placeholder="Add assignment files">
              {appConstant.assignmentFiles.map((lang, i) => {
                return (
                  <Select.Option key={i} value={`${lang}`}>
                    {lang}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="estimatedDuration"
          label="Estimated Duration ( in minutes )"
          rules={[{ required: true, message: "Please Enter Duration" }]}
        >
          <InputNumber type="number" style={{ width: "100%" }} placeholder="Add a estimatd duration" />
        </Form.Item>

        <TextEditor
          defaultValue={editorValue as string}
          handleDefaultValue={setDefaultValue}
          readOnly={false}
          height={300}
          theme="snow"
          placeholder={`Start writing your ${contentType.toLowerCase()}`}
        />
      </Form>
    </Drawer>
  );
};

export default AddAssignment;
