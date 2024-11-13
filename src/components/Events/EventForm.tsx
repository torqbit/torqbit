import { FC, useEffect, useState } from "react";
import styles from "@/styles/Marketing/Blog/Blog.module.scss";
import {
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Flex,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  Select,
  Space,
  TimePicker,
  Tooltip,
  Upload,
  UploadProps,
  message,
} from "antd";
import ImgCrop from "antd-img-crop";
import { CaretDownOutlined, LoadingOutlined } from "@ant-design/icons";
import SvgIcons from "@/components/SvgIcons";
import { postWithFile } from "@/services/request";
import { createSlug, roundToNearestStep } from "@/lib/utils";
import { useRouter } from "next/router";
import { EventMode, Events, EventType, StateType } from "@prisma/client";
import TextEditor from "@/components/Editor/Quilljs/Editor";
import EventService, { IEventUpdate } from "@/services/EventService";
import { certificateConfig } from "@/lib/certificatesConfig";
import dayjs, { Dayjs } from "dayjs";
import { RangePickerProps } from "antd/es/date-picker";
import moment from "moment";
import EventTime from "./EventTime";

const EventForm: FC<{ details?: Events }> = ({ details }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const router = useRouter();
  const [eventDetail, setEventDetail] = useState<Events | undefined>(details);
  const [eventBanner, setEventBanner] = useState<string | null | undefined>(details?.banner);
  const [state, setState] = useState<StateType>();
  const [eventBannerUploading, setEventBannerUploading] = useState<boolean>(false);
  const [loader, setLoader] = useState<{ discard: boolean; publish: boolean }>({
    discard: false,
    publish: false,
  });

  // const [timeRange, setTimeRange] = useState<{
  //   startTime: Dayjs;
  //   endTime: Dayjs;
  //   registrationEndTime: Dayjs;
  // }>({
  //   startTime: !eventDetail?.startTime ? roundToNearestStep(dayjs(new Date()), 30) : dayjs(eventDetail?.startTime),
  //   endTime: !eventDetail?.endTime
  //     ? dayjs(roundToNearestStep(dayjs(new Date()), 30)).add(60, "minute")
  //     : dayjs(eventDetail?.endTime),
  //   registrationEndTime: !eventDetail?.registrationEndDate
  //     ? roundToNearestStep(dayjs(new Date()), 30)
  //     : dayjs(eventDetail?.registrationEndDate),
  // });
  const [timeRange, setTimeRange] = useState<{
    startTime: number;
    endTime: number;
    registrationEndTime: number;
  }>({
    startTime: !eventDetail?.startTime
      ? new Date().getHours() * 60 + 30
      : new Date(eventDetail.startTime).getHours() * 60,
    endTime: !eventDetail?.endTime ? new Date().getHours() * 60 + 90 : new Date(eventDetail.endTime).getHours() * 60,
    registrationEndTime: !eventDetail?.registrationEndDate
      ? new Date().getHours() * 60
      : new Date(eventDetail.registrationEndDate).getHours() * 60,
  });

  const [DateInfo, setDateInfo] = useState<{
    startDate: Dayjs;
    endDate: Dayjs;
    registrationEndDate: Dayjs;
  }>({
    startDate: eventDetail?.startTime === ("null" as any) ? dayjs(new Date()) : dayjs(eventDetail?.startTime),
    endDate: eventDetail?.endTime === ("null" as any) ? dayjs(new Date()) : dayjs(eventDetail?.endTime),
    registrationEndDate:
      eventDetail?.registrationEndDate === ("null" as any)
        ? dayjs(new Date())
        : dayjs(eventDetail?.registrationEndDate),
  });

  const onChangeDateInfo = (date: Dayjs, type: string) => {
    switch (type) {
      case "start":
        form.setFieldValue("startTime", date);
        return setDateInfo({
          ...DateInfo,
          startDate: date,
          endDate: date,
        });
      case "end":
        form.setFieldValue("endTime", date);

        return setDateInfo({
          ...DateInfo,
          endDate: date,
        });

      case "registration":
        form.setFieldValue("registrationEndDate", date);

        return setDateInfo({
          ...DateInfo,
          registrationEndDate: date,
        });
      default:
        break;
    }
  };

  // const onChangeTimeRange = (time: Dayjs, type: string) => {
  //   switch (type) {
  //     case "start":
  //       return setTimeRange({
  //         ...timeRange,
  //         startTime: time,
  //         endTime: time.add(60, "minute"),
  //         registrationEndTime: time,
  //       });
  //     case "end":
  //       return setTimeRange({
  //         ...timeRange,
  //         endTime: time,
  //       });

  //     case "registration":
  //       return setTimeRange({
  //         ...timeRange,
  //         registrationEndTime: time,
  //       });
  //     default:
  //       break;
  //   }
  // };

  const onChangeTimeRange = (time: number, type: string) => {
    console.log(time, type, "this is");
    switch (type) {
      case "start":
        return setTimeRange({
          startTime: time,
          endTime: time + 60,
          registrationEndTime: time,
        });
      case "end":
        return setTimeRange({
          ...timeRange,
          endTime: time,
        });

      case "registration":
        return setTimeRange({
          ...timeRange,
          registrationEndTime: time,
        });
      default:
        break;
    }
  };
  let eventTypeList = [EventType.WORKSHOP, EventType.TALK];
  let eventModeList = [EventMode.OFFLINE, EventMode.ONLINE];

  const initialValues = {
    title: eventDetail?.title,
    eventType: eventDetail?.eventType,
    eventMode: eventDetail?.eventMode,
    location: eventDetail?.location,
    startTime: eventDetail?.startTime === ("null" as any) ? null : dayjs(eventDetail?.startTime),
    endTime: eventDetail?.endTime === ("null" as any) ? null : dayjs(eventDetail?.endTime),
    registrationEndDate:
      eventDetail?.registrationEndDate === ("null" as any) ? null : dayjs(eventDetail?.registrationEndDate),
    certificate: eventDetail?.certificate,
    certificateTemplate: eventDetail?.certificateTemplate,
    eventLink: eventDetail?.eventLink,
    price: eventDetail?.price,
  };

  const handleEditorValue = (value: string) => {
    setEventDetail({ ...eventDetail, description: value } as Events);
  };
  const handleInstructionValue = (value: string) => {
    setEventDetail({ ...eventDetail, eventInstructions: value } as Events);
  };

  const uploadFile = async (file: any, title: string) => {
    if (file) {
      setEventBannerUploading(true);
      const name = title.replace(/\s+/g, "-");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", name);
      formData.append("dir", "/blog/banners/");

      eventBanner && formData.append("existingFilePath", eventBanner);

      const postRes = await postWithFile(formData, `/api/v1/upload/file/upload`);
      if (!postRes.ok) {
        setEventBannerUploading(false);
        throw new Error("Failed to upload file");
      }
      const res = await postRes.json();

      if (res.success) {
        setEventBanner(res.fileCDNPath);
        if (router.query.eventId) {
          EventService.updateEvent(
            { banner: res.fileCDNPath, id: Number(router.query.eventId) },
            (result) => {
              messageApi.success(result.message);
              setEventBannerUploading(false);
            },
            (error) => {
              messageApi.error(error);
              setEventBannerUploading(false);
            }
          );
        } else {
          setEventBannerUploading(false);
        }
      } else {
        setEventBannerUploading(false);
      }
    }
  };
  const handleChange: UploadProps["onChange"] = (info) => {
    if (info.file.status === "uploading") {
      return;
    }
    if (info.file.status === "done") {
      // setLoading(false);
    }
  };

  const joinDateAndTime = (date: Dayjs, minutes: number) => {
    // const combinedDateTime = date.hour(time.hour()).minute(time.minute()).second(time.second());

    // const formattedDateTime = combinedDateTime.toDate();
    // return formattedDateTime;

    const timeFromMinutes = dayjs().startOf("day").add(minutes, "minute");

    const combinedDateTime = date
      .hour(timeFromMinutes.hour())
      .minute(timeFromMinutes.minute())
      .second(timeFromMinutes.second());

    return combinedDateTime.toDate();
  };

  const onPostEvent = (state: StateType, exit?: boolean) => {
    setLoader({ ...loader, publish: true });

    let data: IEventUpdate = {
      ...form.getFieldsValue(),
      registrationEndDate: joinDateAndTime(
        dayjs(form.getFieldsValue().registrationEndDate ? form.getFieldsValue().registrationEndDate : new Date()),
        timeRange.registrationEndTime
      ),

      endTime: joinDateAndTime(
        dayjs(form.getFieldsValue().endTime ? form.getFieldsValue().endTime : new Date()),
        timeRange.endTime
      ),
      startTime: joinDateAndTime(
        dayjs(form.getFieldsValue().startTime ? form.getFieldsValue().startTime : new Date()),
        timeRange.startTime
      ),
      banner: eventBanner,
      description: eventDetail?.description,
      eventInstructions: eventDetail?.eventInstructions,
      certificate: eventDetail?.certificate,
      id: Number(router.query.eventId),
      state,
      slug: createSlug(form.getFieldsValue().title),
    };

    EventService.updateEvent(
      data,
      (result) => {
        messageApi.success(result.message);
        if (exit) {
          router.push("/admin/content");
        }
        setLoader({ ...loader, publish: false });
      },
      (error) => {
        messageApi.error(error);
        setLoader({ ...loader, publish: false });
      }
    );
  };

  const onDelete = (id: number) => {
    setLoader({ ...loader, discard: true });

    EventService.deleteEvent(
      id,
      (result) => {
        messageApi.success(result.message);
        router.push("/admin/content");
        setLoader({ ...loader, discard: false });
      },
      (error) => {
        messageApi.error(error);
        setLoader({ ...loader, discard: false });
      }
    );
  };

  const onCreateEvent = (state: StateType) => {
    setLoader({ ...loader, publish: true });

    let data: IEventUpdate = {
      ...form.getFieldsValue(),
      endTime: form.getFieldsValue().endTime.toISOString(),
      startTime: form.getFieldsValue().startTime.toISOString(),
      banner: eventBanner,
      description: eventDetail?.description,
      eventInstructions: eventDetail?.eventInstructions,
      certificate: eventDetail?.certificate,
      state,
      slug: createSlug(form.getFieldsValue().title),
    };
    EventService.createEvent(
      data,
      (result) => {
        messageApi.success(result.success);
        router.push(`/admin/content/`);
        setLoader({ ...loader, publish: false });
      },
      (error) => {
        messageApi.error(error);
        setLoader({ ...loader, publish: false });
      }
    );
  };

  const disabledDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const disabledEndDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current.isBefore(DateInfo.startDate, "day");
  };
  const enableRegistrationDate: RangePickerProps["disabledDate"] = (current) => {
    return current && (current < moment().startOf("day") || current > DateInfo.startDate);
  };

  return (
    <section className={styles.blogFormConatiner}>
      <Form
        form={form}
        layout="vertical"
        initialValues={router.query.eventId ? initialValues : {}}
        requiredMark={false}
        onFinish={() => {
          router.query.eventId ? onPostEvent(state as StateType, true) : onCreateEvent(state as StateType);
        }}
      >
        {contextHolder}

        <Flex className={styles.publishBtn} align="center" gap={10}>
          <Popconfirm
            title={router.query.eventId ? `Delete the event` : `Discard event`}
            description={
              router.query.eventId ? `Are you sure to delete this event?` : `Are you sure to discard this event?`
            }
            onConfirm={() =>
              router.query.eventId ? onDelete(Number(router.query.eventId)) : router.push("/admin/content")
            }
            okText="Yes"
            cancelText="No"
          >
            <Button loading={loader.discard}>Discard</Button>
          </Popconfirm>

          <Dropdown.Button
            loading={loader.publish}
            type="primary"
            onClick={() => {
              setState(StateType.DRAFT);
              form.submit();
            }}
            icon={SvgIcons.chevronDown}
            menu={{
              items: [
                {
                  key: 1,

                  label: "Publish",
                  onClick: () => {
                    setState(StateType.ACTIVE);
                    form.submit();
                  },
                },
              ],
            }}
          >
            Save as Draft
          </Dropdown.Button>
        </Flex>
        <Space direction="vertical" size={20}>
          <div className={styles.formContainer}>
            <Form.Item
              name="title"
              label={<span>Title</span>}
              rules={[
                {
                  required: true,
                  message: "Required title",
                },
              ]}
            >
              <Input
                onChange={(e) => setEventDetail({ ...eventDetail, title: e.target.value } as Events)}
                placeholder={"Set the title of the Event"}
              />
            </Form.Item>
            <Form.Item className={styles.video_container} label="Add  banner">
              <ImgCrop rotationSlider aspect={16 / 9}>
                <Upload
                  name="avatar"
                  listType="picture-card"
                  className={styles.upload__thumbnail}
                  showUploadList={false}
                  style={{ width: 800, height: 400 }}
                  beforeUpload={(file) => {
                    const bannerName = createSlug(String(eventDetail?.title));
                    uploadFile(file, `${bannerName}_blog_banner`);
                  }}
                  onChange={handleChange}
                >
                  {eventBanner ? (
                    <>
                      <img style={{ borderRadius: 4, objectFit: "cover" }} src={eventBanner} />
                      <Tooltip title={`Upload event banner`}>
                        <div className={styles.camera_btn_img}>
                          {eventBannerUploading && eventBanner ? <LoadingOutlined /> : SvgIcons.camera}
                        </div>
                      </Tooltip>
                      <div className={styles.bannerStatus}>{eventBannerUploading && "Uploading"}</div>
                    </>
                  ) : (
                    <button
                      className={styles.upload_img_button}
                      style={{ border: 0, background: "none", width: 800, height: 400 }}
                      type="button"
                    >
                      {eventBannerUploading ? <LoadingOutlined /> : SvgIcons.uploadIcon}
                      {!eventBannerUploading ? (
                        <div style={{ marginTop: 8 }}>Upload banner</div>
                      ) : (
                        <div>{eventBannerUploading && "Uploading"}</div>
                      )}
                    </button>
                  )}
                </Upload>
              </ImgCrop>
            </Form.Item>
          </div>

          <Flex align="center" gap={40}>
            <Form.Item
              name="eventType"
              label={<span>Event Type</span>}
              rules={[
                {
                  required: true,
                  message: "Required event type",
                },
              ]}
            >
              <Select
                suffixIcon={<CaretDownOutlined />}
                style={{ width: 170 }}
                allowClear={{ clearIcon: <i>{SvgIcons.cross}</i> }}
                placeholder="Select event type"
                defaultValue={eventDetail?.eventType}
              >
                {eventTypeList.map((type, i) => {
                  return (
                    <Select.Option key={i} value={type}>
                      {type}
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>

            <Form.Item
              name="eventMode"
              label={<span>Event Mode</span>}
              rules={[
                {
                  required: true,
                  message: "Required event mode",
                },
              ]}
            >
              <Select
                suffixIcon={<CaretDownOutlined />}
                style={{ width: 170 }}
                allowClear={{ clearIcon: <i>{SvgIcons.cross}</i> }}
                placeholder="Select event mode"
                defaultValue={eventDetail?.eventMode}
                onChange={(value) => {
                  //   setEventMode(value);
                  setEventDetail({ ...eventDetail, eventMode: value } as Events);
                }}
              >
                {eventModeList.map((mode, i) => {
                  return (
                    <Select.Option key={i} value={mode}>
                      {mode}
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Flex>

          <Form.Item
            name="startTime"
            label={<span>Start Time</span>}
            rules={[
              {
                required: true,
                message: "Required start time",
              },
            ]}
          >
            <Flex align="center" gap={40}>
              <DatePicker
                disabledDate={disabledDate}
                value={DateInfo.startDate}
                format={"DD/MM/YY"}
                style={{ width: 170 }}
                onChange={(value) => {
                  value && onChangeDateInfo(value, "start");
                }}
              />
              {/* <TimePicker
                hourStep={1}
                minuteStep={30}
                onOk={(value) => {
                  onChangeTimeRange(value, "start");
                }}
                format="hh:mm"
                value={timeRange.startTime}
                style={{ width: 100 }}
              /> */}
              {/* <EventTime currentHour={new Date().getHours()} currentMin={new Date().getMinutes()} /> */}
              <EventTime
                min={router.query.id ? timeRange.startTime : new Date().getHours() * 60}
                onChangeTimeRange={onChangeTimeRange}
                type="start"
              />
            </Flex>
          </Form.Item>

          <Form.Item
            name="endTime"
            label="End Time"
            rules={[
              {
                required: true,
                message: "Required end time",
              },
            ]}
          >
            <Flex align="center" gap={40}>
              <DatePicker
                value={DateInfo.endDate}
                disabledDate={disabledEndDate}
                format={"DD/MM/YY"}
                style={{ width: 170 }}
                onChange={(value) => {
                  value && onChangeDateInfo(value, "end");
                }}
              />
              {/* <TimePicker
                hourStep={1}
                minuteStep={30}
                format="hh:mm"
                onChange={(value) => {
                  value && onChangeTimeRange(value, "end");
                }}
                value={timeRange.endTime}
                style={{ width: 100 }}
              /> */}
              {/* <EventTime currentHour={new Date().getHours()} currentMin={new Date().getMinutes()} /> */}
              <EventTime
                min={router.query.id ? timeRange.endTime : new Date().getHours() * 60}
                onChangeTimeRange={onChangeTimeRange}
                type="end"
              />
            </Flex>
          </Form.Item>

          <Flex align="" gap={40}>
            <Form.Item name="certificate">
              <Checkbox
                style={{ width: 170 }}
                title=" Certificate"
                checked={eventDetail?.certificate}
                onClick={(value) => {
                  setEventDetail({ ...eventDetail, certificate: !eventDetail?.certificate } as Events);
                }}
              >
                Issue Certificate
              </Checkbox>
            </Form.Item>

            <Form.Item name="certificateTemplate" label={<span>Certificate Template</span>}>
              <Select
                disabled={!eventDetail?.certificate}
                suffixIcon={<CaretDownOutlined />}
                style={{ width: 170 }}
                allowClear={{ clearIcon: <i>{SvgIcons.cross}</i> }}
                placeholder="Select certificate template"
                defaultValue={eventDetail?.certificateTemplate}
              >
                {certificateConfig.map((certificate, i) => {
                  return (
                    <Select.Option key={i} value={`${certificate.id}`}>
                      {certificate.name}
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Flex>
          <Flex align="center" gap={40}>
            <Form.Item required name="price" label={<span>Price (in Rupee)</span>}>
              <InputNumber style={{ width: 170 }} type="number" placeholder={"Add price"} />
            </Form.Item>
            <Form.Item required name="location" label={<span>Location</span>}>
              <Input placeholder={"Add location"} />
            </Form.Item>
          </Flex>

          <Form.Item
            name="registrationEndDate"
            label="Registration end date"
            rules={[
              {
                required: true,
                message: "Required end time",
              },
            ]}
          >
            <Space size={40}>
              <DatePicker
                value={DateInfo.registrationEndDate}
                disabledDate={enableRegistrationDate}
                format={"DD/MM/YY"}
                style={{ width: 170 }}
                onChange={(value) => {
                  value && onChangeDateInfo(value, "registration");
                }}
              />
              {/* <TimePicker
                hourStep={1}
                minuteStep={30}
                format="hh:mm"
                value={timeRange.registrationEndTime}
                onOk={(value) => {
                  onChangeTimeRange(value, "registration");
                }}
                style={{ width: 100 }}
              /> */}
            </Space>
          </Form.Item>

          <Form.Item
            rules={[
              {
                required: true,
                message: "Required event link",
              },
            ]}
            name={"eventLink"}
            label={<span>Link</span>}
          >
            <Input
              type="url"
              disabled={eventDetail?.eventMode === undefined}
              placeholder={`Add ${
                eventDetail?.eventMode === EventMode.ONLINE ? "Event Link" : " Location link"
              } for event`}
            />
          </Form.Item>
          <Form.Item label="Event Instructions">
            <div className={styles.instruction_editor}>
              <TextEditor
                defaultValue={eventDetail?.eventInstructions ? eventDetail.eventInstructions : ""}
                handleDefaultValue={handleInstructionValue}
                readOnly={false}
                width={800}
                borderRadius={8}
                height={150}
                theme="bubble"
                placeholder={`Start writing your event instructions`}
              />
            </div>
          </Form.Item>

          <Form.Item label="Description">
            <div className={styles.editorContainer}>
              <TextEditor
                defaultValue={eventDetail?.description ? eventDetail.description : ""}
                handleDefaultValue={handleEditorValue}
                readOnly={false}
                width={800}
                height={400}
                theme="snow"
                placeholder={`Start writing your event description`}
              />
            </div>
          </Form.Item>
        </Space>
      </Form>
    </section>
  );
};

export default EventForm;
