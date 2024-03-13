import {
  Button,
  Drawer,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Segmented,
  Upload,
  Select,
  message,
  Space,
  Popconfirm,
  MenuProps,
  Dropdown,
} from "antd";
import { FC } from "react";
import styles from "@/styles/AddCourse.module.scss";
import { useRouter } from "next/router";
import { CloseOutlined, EllipsisOutlined, PlusOutlined } from "@ant-design/icons";
import { Resource, ResourceContentType } from "@prisma/client";
import appConstant from "@/services/appConstant";
import { IAddResource } from "@/lib/types/program";
import ProgramService from "@/services/ProgramService";
import { error } from "console";

const ResourceList: FC<{
  name: string;
  contentType: ResourceContentType;
  setAddRes: (value: IAddResource) => void;
  addRes: IAddResource;
  duration: number | null;
  resId: number;
  onFindRsource: (id: number) => void;
  formData: FormInstance;
  chapterId: number;
}> = ({ name, contentType, duration, setAddRes, addRes, resId, chapterId, onFindRsource, formData }) => {
  const router = useRouter();

  const onDeleteResource = () => {
    ProgramService.deleteResource(
      Number(resId),
      (result) => {
        message.success(result.message);
        onFindRsource(chapterId);
      },
      (error) => {
        message.error(error);
      }
    );
  };

  const onEditResource = () => {
    ProgramService.getResource(
      resId,
      (result) => {
        formData.setFieldValue("name", result.resource?.name);
        formData.setFieldValue("description", result.resource?.description);
        formData.setFieldValue("assignmentLang", result.resource.assignmentLang);
        formData.setFieldValue("submitDay", result.resource.daysToSubmit);
        formData.setFieldValue("VideoUrl", result.resource.thumbnail);
        formData.setFieldValue("duration", result.resource.videoDuration);
        formData.setFieldValue("index", result.resource.sequenceId);
        formData.setFieldValue("assignment_file", result.resource.content);
        formData.setFieldValue("contentType", result.resource.contentType);

        setAddRes({
          ...addRes,
          content: result.resource.contentType,
          chapterId: result.resource.chapterId,
        });
      },
      (error) => {}
    );
  };

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: "Edit",

      onClick: () => {
        router.replace(`/programs/${router.query.programId}/add-overview?edit=true&resId=${resId}`);
        onEditResource();
      },
      style: { textAlign: "center" },
    },
    {
      key: "2",

      label: (
        <Popconfirm
          title="Delete the Resource"
          description="Are you sure to delete this resource?"
          onConfirm={onDeleteResource}
          okText="Yes"
          cancelText="No"
        >
          Delete
        </Popconfirm>
      ),
      onClick: () => {},
      style: { textAlign: "center" },
    },
  ];
  return (
    <div className={`${styles.resorceListWrapper}  ${Number(router.query.resId) === resId && `${styles.resSelected}`}`}>
      <div className={styles.resourceListContent}>
        <div>
          {contentType === "Video" ? (
            <img height={30} width={30} src="/img/about-course/playcircle.svg" alt="Video" />
          ) : (
            <img height={30} width={30} src="/img/about-course/assignment.svg" alt="Assignment" />
          )}
        </div>
        <div>
          <div>{name ? name : <>{contentType === "Video" ? "New Video" : "New Assignment"}</>}</div>
          {contentType === "Assignment" ? <div>{duration} hrs</div> : <div>{duration} min</div>}
        </div>
      </div>
      <Dropdown menu={{ items }} trigger={["click"]} placement="bottom" arrow>
        <EllipsisOutlined className={styles.ellipsisOutlined} />
      </Dropdown>
    </div>
  );
};

const AddResource: FC<{
  setAddRes: (value: IAddResource) => void;
  addRes: IAddResource;
  formData: FormInstance;
  loading: boolean | undefined;
  chapterId: number;
  onCreateRes: (chapterId: number) => void;
  setResourceDrawer: (value: boolean) => void;
  showResourceDrawer: boolean;
  availableRes: Resource[] | undefined;
  onFindRsource: (id: number) => void;
  onUpdateRes: (resId: number) => void;
}> = ({
  setResourceDrawer,
  showResourceDrawer,
  onUpdateRes,
  loading,
  chapterId,
  setAddRes,
  formData,
  onCreateRes,
  availableRes,
  addRes,
  onFindRsource,
}) => {
  const router = useRouter();

  const onUploadAssignment = (info: any) => {
    if (info.file.status !== "uploading") {
    }
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
      const res = info.file.response; // TODO
      setAddRes({ ...addRes, assignmentFileName: res.fileName });
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  let currentSeqIds = availableRes?.map((r) => {
    return r.sequenceId;
  });

  return (
    <>
      <Drawer
        width={800}
        maskClosable={false}
        closeIcon={false}
        className={styles.newResDetails}
        title={
          <div className={styles.drawerHeader}>
            <div>
              <ResourceList
                chapterId={0}
                resId={0}
                formData={formData}
                onFindRsource={onFindRsource}
                name={addRes.name}
                duration={addRes.duration}
                contentType={addRes.content}
                setAddRes={setAddRes}
                addRes={addRes}
              />
            </div>
            <Space className={styles.drawerTitle}>
              <CloseOutlined
                onClick={() => {
                  setResourceDrawer(false);
                }}
              />
              New Resource Details
            </Space>
          </div>
        }
        placement="right"
        onClose={() => {
          setResourceDrawer(false);
          formData.resetFields();
          router.replace(`/programs/${router.query.programId}/add-overview?edit=true`);
        }}
        open={showResourceDrawer}
        footer={
          <Form
            form={formData}
            onFinish={() => {
              router.query.resId ? onUpdateRes(Number(router.query.resId)) : onCreateRes(chapterId);
            }}
          >
            <Space className={styles.footerBtn}>
              <Button loading={loading} type="primary" htmlType="submit">
                {router.query.resId ? "Update" : "Save"}
              </Button>
              <Button
                type="default"
                onClick={() => {
                  setResourceDrawer(false);
                  router.query.resId && router.replace(`/programs/${router.query.programId}/add-overview?edit=true`);
                  formData.resetFields();
                  setAddRes({
                    content: "Video",
                    chapterId: 0,
                    name: "",
                    duration: 0,
                    assignmentFileName: "",
                  });
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form>
        }
      >
        <div className={styles.drawerContainer}>
          <div className={styles.resourceContainer}>
            {availableRes && availableRes?.length >= 1 ? (
              availableRes?.map((c: Resource, i) => {
                return (
                  <ResourceList
                    chapterId={c.chapterId}
                    resId={c.resourceId}
                    formData={formData}
                    key={i}
                    name={c.name}
                    contentType={c.contentType}
                    duration={c.contentType === "Video" ? c.videoDuration : c.daysToSubmit}
                    onFindRsource={onFindRsource}
                    setAddRes={setAddRes}
                    addRes={addRes}
                  />
                );
              })
            ) : (
              <div className={styles.resorceListWrapper} style={{ border: "none" }}></div>
            )}
          </div>
          <Form
            form={formData}
            layout="vertical"
            onFinish={() => {
              router.query.resId ? onUpdateRes(Number(router.query.resId)) : onCreateRes(chapterId);
            }}
          >
            <div className={styles.formCourseName}>
              <Form.Item label="Title" name="name" rules={[{ required: true, message: "Please Enter Title" }]}>
                <Input
                  onChange={(e) => {
                    !router.query.resId && setAddRes({ ...addRes, name: e.target.value });
                  }}
                  placeholder="Set the title of the resource"
                />
              </Form.Item>
              <div>
                <div>
                  <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: "Please Enter Description" }]}
                  >
                    <Input.TextArea rows={4} placeholder="Brief description about the resource" />
                  </Form.Item>
                </div>
              </div>

              <div>
                <Form.Item label="Set Index" name="index" rules={[{ required: true, message: "Please Enter Index" }]}>
                  <Select placeholder="Choose index">
                    {currentSeqIds &&
                      currentSeqIds.length >= 1 &&
                      currentSeqIds.map((seq) => {
                        return <Select.Option value={`${seq}`}>{seq}</Select.Option>;
                      })}
                    {!router.query.resId && (
                      <>
                        {currentSeqIds && currentSeqIds.length >= 1 ? (
                          <Select.Option value={`${currentSeqIds.length + 1}`}>
                            {currentSeqIds.length + 1}
                          </Select.Option>
                        ) : (
                          <Select.Option value="1">1</Select.Option>
                        )}
                      </>
                    )}
                  </Select>
                </Form.Item>
              </div>

              <div>
                <Form.Item label={"Choose resource type"} name={"contentType"}>
                  <Segmented
                    onChange={(v) => {
                      !router.query.resId &&
                        setAddRes({
                          ...addRes,
                          content: v.toLocaleString() as ResourceContentType,
                        });
                    }}
                    options={["Video", "Assignment"]}
                    size="middle"
                  />
                </Form.Item>
              </div>

              {addRes.content === "Video" && (
                <div>
                  <div>
                    <Form.Item
                      name="VideoUrl"
                      label="Video URL"
                      rules={[{ required: true, message: "Please Enter Description" }]}
                    >
                      <Input placeholder="Enter the url" />
                    </Form.Item>
                  </div>
                  <div>
                    <Form.Item
                      name="duration"
                      label="Video Duration(in minutes)"
                      rules={[{ required: true, message: "Please Enter Description" }]}
                    >
                      <InputNumber
                        onChange={(e) => !router.query.resId && setAddRes({ ...addRes, duration: Number(e) })}
                        style={{ width: 330 }}
                        placeholder="Enter the Duration"
                      />
                    </Form.Item>
                  </div>
                </div>
              )}
              {addRes.content === "Assignment" && (
                <div>
                  <Form.Item
                    label="Hours To Submit "
                    name="submitDay"
                    rules={[{ required: true, message: "Required Days" }]}
                  >
                    <InputNumber
                      onChange={(e) => !router.query.resId && setAddRes({ ...addRes, duration: Number(e) })}
                      style={{ width: 330 }}
                      min={1}
                      placeholder="Enter submit hours"
                    />
                  </Form.Item>
                  <Form.Item
                    label="Languages"
                    name="assignmentLang"
                    rules={[{ required: true, message: "Required Languages" }]}
                  >
                    <Select
                      mode="multiple"
                      showSearch
                      style={{ width: "100%" }}
                      placeholder="Add Language"
                      options={appConstant.assignmentLang?.map((lang) => ({
                        label: lang,
                        value: lang,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item label="Assignment file" name="assignment_file">
                    <Upload
                      onChange={onUploadAssignment}
                      style={{ width: "100%" }}
                      multiple={false}
                      maxCount={1}
                      action="/api/assignment/save"
                      listType="text"
                    >
                      <Button style={{ width: "100%" }} icon={<PlusOutlined rev={undefined} />}>
                        Upload
                      </Button>
                    </Upload>
                  </Form.Item>
                </div>
              )}
            </div>
          </Form>
        </div>
      </Drawer>
    </>
  );
};

export default AddResource;