import { Button, Flex, Form, Input, message, Select, Steps, Tag } from "antd";
import ConfigFormLayout from "@/components/Configuration/ConfigFormLayout";
import { FC, ReactNode, useEffect, useState } from "react";
import cmsClient from "@/lib/admin/cms/cmsClient";
import styles from "./CMS.module.scss";
import FormDisableOverlay from "../FormDisableOverlay";

import cmsConstant from "@/lib/admin/cms/cmsConstant";
import { PageSiteConfig } from "@/services/siteConstant";
import ConfigForm from "@/components/Configuration/ConfigForm";
import { ConfigurationState } from "@prisma/client";
import SvgIcons from "@/components/SvgIcons";
import SpinLoader from "@/components/SpinLoader/SpinLoader";
import { StorageConfig } from "@/types/cms/bunny";

export interface IConfigForm {
  title: string;
  description: string;
  input: ReactNode;
  inputName: string;
  optional?: boolean;
  divider?: boolean;
  layout?: "vertical" | "horizontal";
}

const ContentManagementSystem: FC<{ siteConfig: PageSiteConfig }> = ({ siteConfig }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [accessKeyForm] = Form.useForm();
  const [selectedWatermark, setWatermark] = useState<string | null>(null);
  const [replicationRegions, setRegions] = useState<{ name: string; code: string }[]>([]);
  const [videoForm] = Form.useForm();
  const [storageForm] = Form.useForm();

  const [loading, setLoading] = useState<boolean>(false);
  const [vodLoading, setVodLoading] = useState<boolean>(false);
  const [storageLoading, setStorageLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [configState, setConfigState] = useState<ConfigurationState>(ConfigurationState.INITIATED);

  const [current, setCurrent] = useState<number>(0);
  let logoUrl = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/${siteConfig.brand?.logo}`;
  let iconUrl = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/img/logo.png`;

  const videoItems = [
    {
      title: "Choose Replication Regions",
      description: "Choose regions from where the video will be accessed and streamed to the users",
      optional: false,

      input: (
        <Select
          labelInValue
          optionLabelProp="label"
          style={{ width: 250 }}
          mode="tags"
          placeholder="Choose replication regions"
        >
          {replicationRegions.map((region, i) => {
            return (
              <Select.Option key={i} value={`${region.code}`}>
                {region.name}
              </Select.Option>
            );
          })}
        </Select>
      ),
      inputName: "replicatedRegions",
    },

    {
      title: "Upload Watermark",
      optional: true,

      description:
        "Automatically watermark uploaded videos. The watermark is encoded into the video itself and cannot be removed after encoding.",
      input: (
        <Flex className={styles.watermark__options} align="center" gap={20}>
          <div
            onClick={() => {
              if (iconUrl === selectedWatermark) {
                setWatermark(null);
              } else {
                setWatermark(iconUrl);
              }
            }}
            className={iconUrl === selectedWatermark ? styles.selected__watermark : ""}
          >
            <img src={iconUrl} alt="torqbit icon" />
          </div>
          <div
            onClick={() => {
              if (logoUrl === selectedWatermark) {
                setWatermark(null);
              } else {
                setWatermark(logoUrl);
              }
            }}
            className={logoUrl === selectedWatermark ? styles.selected__watermark : ""}
          >
            <img src={logoUrl} alt="torqbit logo" />
          </div>
        </Flex>
      ),
      inputName: "watermarkUrl",
    },
    {
      title: "Set Resolutions",
      optional: false,

      description:
        "Select te enabled resolutions that will be encoded. Only resolutions smaller than or equal to the original video resolutions will be used during encoding.",
      input: (
        <Select
          labelInValue
          optionLabelProp="label"
          style={{ width: 250 }}
          mode="tags"
          placeholder="Select resolutions"
        >
          {cmsConstant.videoResolutions.map((resolution, i) => {
            return (
              <Select.Option key={i} value={`${resolution.value}`}>
                {resolution.label}
              </Select.Option>
            );
          })}
        </Select>
      ),
      inputName: "videoResolutions",
    },
  ];

  const cdnItems: IConfigForm[] = [
    {
      title: "Main Storage Region",
      description:
        "Give a name to the storage zone that will be storing all the static images for courses, events and users",
      input: (
        <Select labelInValue style={{ width: 250 }} placeholder="Choose the main region">
          {replicationRegions.map((region, i) => {
            return (
              <Select.Option key={i} value={`${region.code}`}>
                {region.name}
              </Select.Option>
            );
          })}
        </Select>
      ),

      inputName: "mainStorageRegion",
    },
    {
      title: "Choose Replication Regions",
      description: "Choose regions from where the video will be accessed and streamed to the users",
      input: (
        <Select
          labelInValue
          optionLabelProp="label"
          style={{ width: 250 }}
          mode="tags"
          placeholder="Choose replication regions"
        >
          {replicationRegions.map((region, i) => {
            return (
              <Select.Option key={i} value={`${region.code}`}>
                {region.name}
              </Select.Option>
            );
          })}
        </Select>
      ),
      inputName: "replicatedRegions",
    },
  ];

  const listRegions = () => {
    try {
      cmsClient.listReplicationRegions(
        "ACCESS_KEY",
        "bunny.net",
        (result) => {
          setRegions(result.regions);

          setLoading(false);
        },
        (error) => {
          setCurrent(0);
          messageApi.error(error);
          setLoading(false);
        }
      );
    } catch (error) {
      setCurrent(0);
      messageApi.error(error as string);
      setLoading(false);
    }
  };

  const onTestAccessKey = () => {
    try {
      setLoading(true);
      cmsClient.testAccessKey(
        accessKeyForm.getFieldsValue().accessKey,
        "bunny.net",
        (result) => {
          listRegions();
          setCurrent(1);
          messageApi.success(result.message);
        },
        (error) => {
          setCurrent(0);
          messageApi.error(error);
          setLoading(false);
        }
      );
    } catch (error) {
      setCurrent(0);
      messageApi.error(error as string);
      setLoading(false);
    }
  };

  const onSubmitVideoInfo = () => {
    setVodLoading(true);
    let data = {
      ...videoForm.getFieldsValue(),
      replicatedRegions: videoForm
        .getFieldsValue()
        .replicatedRegions.map((r: any) => (typeof r !== "object" ? r : r.value)),
      videoResolutions: videoForm
        .getFieldsValue()
        .videoResolutions.map((r: any) => (typeof r !== "object" ? r : r.value)),
      watermarkUrl: selectedWatermark,
      brandName: siteConfig.brand?.name,
      playerColor: siteConfig.brand?.brandColor,
      provider: "bunny.net",
    };

    cmsClient.addVod(
      data,
      (result) => {
        messageApi.success(result.message);
        setCurrent(2);
        setVodLoading(false);
      },
      (error) => {
        messageApi.error(error);
        setVodLoading(false);
      }
    );
  };

  const onSubmitStorageForm = () => {
    setStorageLoading(true);
    const formData = storageForm.getFieldsValue();
    let data: StorageConfig = {
      ...storageForm.getFieldsValue(),
      replicatedRegions: formData.replicatedRegions.map((r: any) => (typeof r !== "object" ? r : r.value)),
      mainStorageRegion: formData.mainStorageRegion.value,
      brandName: siteConfig.brand?.name,
      provider: "bunny.net",
    };

    cmsClient.addStorage(
      data,
      (result) => {
        messageApi.success(result.message);
        setStorageLoading(false);
      },
      (error) => {
        messageApi.error(error);
        setStorageLoading(false);
      }
    );
  };

  const getCurrentStep = (status: ConfigurationState) => {
    switch (status) {
      case ConfigurationState.AUTHENTICATED:
        return setCurrent(1);
      case ConfigurationState.VOD_CONFIGURED:
        return setCurrent(2);
      case ConfigurationState.STORAGE_CONFIGURED:
        return setCurrent(3);
      default:
        return setCurrent(0);
    }
  };
  const getDetail = () => {
    cmsClient.getConfigDetail(
      "bunny.net",
      (result) => {
        listRegions();
        setWatermark(result.config.config.vodConfig?.watermarkUrl as string);
        getCurrentStep(result.config.state);
        videoForm.setFieldsValue({
          replicatedRegions: result.config.config.vodConfig?.replicatedRegions,
          videoResolutions: result.config.config.vodConfig?.videoResolutions,
        });
        storageForm.setFieldsValue({
          mainStorageRegion: result.config.config.storageConfig?.mainStorageRegion,
          replicatedRegions: result.config.config.storageConfig?.replicatedRegions,
        });
        setPageLoading(false);
        setConfigState(result.config.state);
      },
      (error) => {
        messageApi.error(error);
        setPageLoading(false);
      }
    );
  };
  useEffect(() => {
    getDetail();
  }, []);

  return (
    <>
      {pageLoading ? (
        <SpinLoader className="settings__spinner" />
      ) : (
        <section>
          {contextHolder}
          <h3>Content Management System</h3>

          <Steps
            current={current}
            status="finish"
            size="small"
            progressDot
            direction="vertical"
            items={[
              {
                title: (
                  <ConfigFormLayout
                    formTitle={"Configure Bunny.net"}
                    extraContent={
                      <Flex align="center" gap={10}>
                        {current < 0 && <Button onClick={() => accessKeyForm.resetFields()}>Reset</Button>}

                        {current > 0 ? (
                          <Tag style={{ padding: "5px 10px" }}>
                            <Flex align="center" gap={5}>
                              <i style={{ lineHeight: 0, fontSize: 15 }}>{SvgIcons.checkFilled}</i>
                              <span>Connected</span>
                            </Flex>
                          </Tag>
                        ) : (
                          <Button loading={loading} onClick={() => accessKeyForm.submit()} type="primary">
                            Connect
                          </Button>
                        )}
                      </Flex>
                    }
                  >
                    <Form form={accessKeyForm} onFinish={onTestAccessKey} requiredMark={false}>
                      <ConfigForm
                        input={
                          <Form.Item
                            style={{ width: 250 }}
                            name={"accessKey"}
                            rules={[{ required: true, message: "Access key is required!" }]}
                          >
                            {
                              <Input.Password
                                disabled={current > 1}
                                placeholder={current > 0 ? "****************************" : "Add access key"}
                              />
                            }
                          </Form.Item>
                        }
                        title={"Bunny.net Access Key"}
                        description={
                          "Provide access key for Bunny.net that will be used to configure video stream, image CDN and file storage"
                        }
                        divider={false}
                        inputName={""}
                      />
                    </Form>
                  </ConfigFormLayout>
                ),
              },
              {
                title: (
                  <ConfigFormLayout
                    extraContent={
                      <Button loading={vodLoading} onClick={() => videoForm.submit()} type="primary">
                        Save
                      </Button>
                    }
                    formTitle={"Video On Demand"}
                  >
                    <Form form={videoForm} onFinish={onSubmitVideoInfo} requiredMark={false}>
                      {videoItems.map((item, i) => {
                        return (
                          <ConfigForm
                            input={
                              <Form.Item
                                name={item.inputName}
                                rules={[{ required: !item.optional, message: `Field is required!` }]}
                                key={i}
                              >
                                {item.input}
                              </Form.Item>
                            }
                            title={item.title}
                            description={item.description}
                            divider={i === videoItems.length - 1 ? false : true}
                            inputName={""}
                            optional={item.optional}
                          />
                        );
                      })}
                      {current < 1 && <FormDisableOverlay />}
                    </Form>
                  </ConfigFormLayout>
                ),
              },
              {
                title: (
                  <ConfigFormLayout
                    extraContent={
                      <Flex align="center" gap={10}>
                        <Button
                          onClick={() => storageForm.submit()}
                          type="primary"
                          loading={storageLoading}
                          disabled={configState == ConfigurationState.STORAGE_CONFIGURED}
                        >
                          Save
                        </Button>
                      </Flex>
                    }
                    formTitle={"File Storage"}
                  >
                    <Form form={storageForm} onFinish={onSubmitStorageForm}>
                      {cdnItems.map((item, i) => {
                        return (
                          <ConfigForm
                            input={
                              <Form.Item
                                rules={[{ required: !item.optional, message: `Field is required!` }]}
                                name={item.inputName}
                                key={i}
                              >
                                {item.input}
                              </Form.Item>
                            }
                            title={item.title}
                            description={item.description}
                            divider={i === cdnItems.length - 1 ? false : true}
                            optional={item.optional}
                            inputName={""}
                          />
                        );
                      })}
                      {current < 2 && <FormDisableOverlay />}
                    </Form>
                  </ConfigFormLayout>
                ),
              },
            ]}
          />
        </section>
      )}
    </>
  );
};

export default ContentManagementSystem;
