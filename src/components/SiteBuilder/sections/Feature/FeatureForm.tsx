import { FC, useEffect, useState } from "react";
import styles from "./FeatureForm.module.scss";
import {
  Button,
  ColorPicker,
  Divider,
  Flex,
  Form,
  FormInstance,
  Input,
  message,
  Segmented,
  Tooltip,
  Upload,
} from "antd";
import ConfigForm from "@/components/Configuration/ConfigForm";
import { IConfigForm } from "@/components/Configuration/CMS/ContentManagementSystem";
import { IFeatureCard, IFeatureInfo } from "@/types/landing/feature";
import { PageSiteConfig } from "@/services/siteConstant";
import ImgCrop from "antd-img-crop";
import { UploadOutlined } from "@ant-design/icons";
import { RcFile } from "antd/es/upload";
import Image from "next/image";
import { createSlug, getExtension } from "@/lib/utils";
import { postWithFile } from "@/services/request";

const AddFeatureForm: FC<{
  imageType: string;
  index: number;
  imgPath: string;
  isIconExist: boolean;
  beforeUpload: (file: RcFile, imageType: string, index: number) => void;
  handleFeatureChange: (index: number, key: string, value: string) => void;
}> = ({ beforeUpload, handleFeatureChange, imageType, index, imgPath, isIconExist }) => {
  return (
    <div className={styles.feature__card__form}>
      <ImgCrop rotationSlider aspect={1 / 1}>
        <Upload
          showUploadList={false}
          maxCount={1}
          beforeUpload={(file: RcFile) => beforeUpload(file, imageType, index)}
        >
          {!isIconExist ? (
            <Button icon={<UploadOutlined />} style={{ width: 60 }}>
              Logo
            </Button>
          ) : (
            <Tooltip title="Upload icon">
              <Image src={`${imgPath}`} height={60} width={60} alt="image" style={{ cursor: "pointer" }} />
            </Tooltip>
          )}
        </Upload>
      </ImgCrop>
      <Form.Item name={`title_${index}`}>
        <Input
          onChange={(e) => {
            handleFeatureChange(index, "title", e.currentTarget.value);
          }}
          placeholder="Add  title "
        />
      </Form.Item>
      <Form.Item name={`description_${index}`}>
        <Input
          onChange={(e) => {
            handleFeatureChange(index, "description", e.currentTarget.value);
          }}
          placeholder="Add  description "
        />
      </Form.Item>
      <Form.Item name={`link_${index}`}>
        <Input
          addonBefore={"https://"}
          onChange={(e) => {
            handleFeatureChange(index, "link", `/${e.currentTarget.value}`);
          }}
          placeholder="Add  link "
        />
      </Form.Item>
    </div>
  );
};

const FeatureForm: FC<{
  config: PageSiteConfig;
  updateSiteConfig: (config: PageSiteConfig) => void;
}> = ({ updateSiteConfig, config }) => {
  const [form] = Form.useForm();
  const [featureConfig, setFeatureConfig] = useState<IFeatureInfo | undefined>(config?.sections?.feature?.featureInfo);

  const [featureImages, setFeatureImages] = useState<{ firstIcon: string; secondIcon: string; thirdIcon: string }>({
    firstIcon: featureConfig?.featureList[0].img ? featureConfig?.featureList[0].img : "",
    secondIcon: featureConfig?.featureList[1].img ? featureConfig?.featureList[1].img : "",
    thirdIcon: featureConfig?.featureList[2].img ? featureConfig?.featureList[2].img : "",
  });

  const beforeUpload = async (file: File, imageType: string, index: number) => {
    try {
      if (file) {
        const imgName = `feature-${createSlug(imageType)}.${getExtension(file.name)}`;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("imgName", imgName);
        formData.append("previousPath", featureConfig?.featureList[index].img.split("/").pop() as string);

        const postRes = await postWithFile(formData, `/api/v1/admin/site/image/save`);
        if (!postRes.ok) {
          throw new Error("Failed to upload file");
        }
        const res = await postRes.json();

        if (res.success) {
          setFeatureImages({ ...featureImages, [imageType]: `/static/${res.imgName}` });
          handleFeatureChange(index, "img", `/static/${res.imgName}`);
        }
      }
    } catch (error) {
      message.error(`Error uploading file: ${file.name}`);
    }
    return false;
  };

  const handleFeatureChange = (index: number, key: string, value: string) => {
    setFeatureConfig((prevTheme: any) => {
      const updatedFeatureList = [...prevTheme.featureList];
      updatedFeatureList[index] = {
        ...updatedFeatureList[index],
        [key]: value,
      };

      return {
        ...prevTheme,

        featureList: updatedFeatureList,
      };
    });
  };

  useEffect(() => {
    updateSiteConfig({
      ...config,
      sections: {
        ...config.sections,
        feature: {
          featureInfo: featureConfig,
        },
      },
    });
  }, [featureConfig]);

  const addFeatureList = [
    {
      imageType: "firstIcon",
      index: 0,
      imgPath: `${featureConfig?.featureList[0].img}`,
      isIconExist: featureImages.firstIcon !== "",
      handleFeatureConfig: handleFeatureChange,
      beforeUpload: beforeUpload,
    },
    {
      imageType: "secondIcon",
      index: 1,
      imgPath: `${featureConfig?.featureList[1].img}`,
      isIconExist: featureImages.secondIcon !== "",
      handleFeatureConfig: handleFeatureChange,
      beforeUpload: beforeUpload,
    },
    {
      imageType: "thirdIcon",
      index: 2,
      imgPath: `${featureConfig?.featureList[2].img}`,
      isIconExist: featureImages.thirdIcon !== "",
      handleFeatureConfig: handleFeatureChange,
      beforeUpload: beforeUpload,
    },
  ];

  let initialValues = {
    title: config.sections?.feature?.featureInfo?.title,
    description: config.sections?.feature?.featureInfo?.description,
    title_0: config.sections?.feature?.featureInfo?.featureList[0].title,
    description_0: config.sections?.feature?.featureInfo?.featureList[0].description,
    link_0: config.sections?.feature?.featureInfo?.featureList[0].link,

    title_1: config.sections?.feature?.featureInfo?.featureList[1].title,
    description_1: config.sections?.feature?.featureInfo?.featureList[1].description,
    link_1: config.sections?.feature?.featureInfo?.featureList[1].link,

    title_2: config.sections?.feature?.featureInfo?.featureList[2].title,
    description_2: config.sections?.feature?.featureInfo?.featureList[2].description,
    link_2: config.sections?.feature?.featureInfo?.featureList[2].link,
  };

  const featureItems: IConfigForm[] = [
    {
      title: "Feature Title",
      description: "Add a Title  for feature ",
      layout: "vertical",
      input: (
        <Input
          onChange={(e) => {
            setFeatureConfig({ ...featureConfig, title: e.currentTarget.value } as IFeatureInfo);
          }}
          placeholder="Add feature title "
        />
      ),
      inputName: "title",
    },

    {
      title: "Feature description",
      description: "Add description for feature ",
      layout: "vertical",
      input: (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 4 }}
          onChange={(e) => {
            setFeatureConfig({ ...featureConfig, description: e.currentTarget.value } as IFeatureInfo);
          }}
          placeholder="Add description"
        />
      ),
      inputName: "description",
    },

    {
      title: "Feature List",
      description: "Add features list ",
      layout: "vertical",
      input: (
        <Flex vertical gap={10}>
          {addFeatureList.map((list, i) => {
            return (
              <AddFeatureForm
                key={i}
                imageType={list.imageType}
                index={list.index}
                imgPath={list.imgPath}
                isIconExist={list.isIconExist}
                beforeUpload={list.beforeUpload}
                handleFeatureChange={list.handleFeatureConfig}
              />
            );
          })}
        </Flex>
      ),
      inputName: "",
    },
  ];

  return (
    <div className={styles.feature__wrapper}>
      <Form form={form} requiredMark={false} initialValues={initialValues}>
        {featureItems.map((item, i) => {
          return (
            <>
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
                layout={item.layout}
                divider={i === featureItems.length - 1 ? false : true}
                inputName={""}
                optional={item.optional}
              />
              {featureItems.length !== i + 1 && <Divider style={{ margin: "0px 0px 15px 0px" }} />}
            </>
          );
        })}
      </Form>
    </div>
  );
};

export default FeatureForm;
