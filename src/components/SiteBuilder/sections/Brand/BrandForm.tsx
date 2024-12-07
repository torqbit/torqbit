import { FC, useEffect, useState } from "react";
import styles from "./BrandForm.module.scss";
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
import { UploadOutlined } from "@ant-design/icons";
import { DEFAULT_THEME, PageSiteConfig } from "@/services/siteConstant";
import { IBrandConfig, ISocialLinks } from "@/types/schema";
import { RcFile } from "antd/es/upload";
import Image from "next/image";
import ImgCrop from "antd-img-crop";
import SvgIcons from "@/components/SvgIcons";
import { getFetch, postFetch, postWithFile } from "@/services/request";
import { getExtension } from "@/lib/utils";

const BrandForm: FC<{
  config: PageSiteConfig;
  updateSiteConfig: (config: PageSiteConfig) => void;
}> = ({ updateSiteConfig, config }) => {
  const [form] = Form.useForm();
  const [brandConfig, setBrandConfig] = useState<IBrandConfig | undefined>(config.brand);
  const [brandImage, setBrandImage] = useState<{ logo: string; icon: string }>({
    logo: config.brand?.logo ? (config.brand.logo as string) : "",
    icon: config.brand?.icon ? (config.brand?.icon as string) : "",
  });
  const [selectedSegment, setSelectedSegment] = useState<string>("discord");

  const beforeUpload = async (file: File, imageType: string) => {
    const getImageName = () => {
      if (imageType === "icon" && typeof brandConfig?.icon === "string") {
        const name = brandConfig.icon.split("/").pop();
        return name as string;
      } else if (imageType === "logo" && typeof brandConfig?.logo === "string") {
        const name = brandConfig.logo.split("/").pop();
        return name as string;
      } else {
        return "";
      }
    };

    try {
      if (file) {
        const imgName = `${imageType}.${getExtension(file.name)}`;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("imgName", imgName);
        formData.append("previousPath", getImageName());

        const postRes = await postWithFile(formData, `/api/v1/admin/site/image/save`);
        if (!postRes.ok) {
          throw new Error("Failed to upload file");
        }
        const res = await postRes.json();

        if (res.success) {
          setBrandImage({ ...brandImage, [imageType]: `/static/${res.imgName}` });
          setBrandConfig({ ...brandConfig, [imageType]: `/static/${res.imgName}` });
        }
      }
    } catch (error) {
      message.error(`Error uploading file: ${file.name}`);
    }
    return false;
  };

  const onUpdateBrandConfig = (value: string, key: string) => {
    if (key.startsWith("socialLinks")) {
      const linkKey = key.split(".")[1];
      setBrandConfig({ ...brandConfig, socialLinks: { ...brandConfig?.socialLinks, [linkKey]: value } });
    } else {
      setBrandConfig({ ...brandConfig, [key]: value });
    }
  };

  useEffect(() => {
    updateSiteConfig({ ...config, brand: brandConfig });
  }, [brandConfig]);
  const brandItems: IConfigForm[] = [
    {
      title: "Brand name",
      description: "Add a brand name for your site ",
      layout: "vertical",
      input: (
        <Input
          onChange={(e) => {
            onUpdateBrandConfig(e.currentTarget.value, "name");
          }}
          placeholder="Add brand name"
        />
      ),
      inputName: "name",
    },
    {
      title: "Site title",
      description: "Add a title for your site ",
      layout: "vertical",
      input: (
        <Input
          onChange={(e) => {
            onUpdateBrandConfig(e.currentTarget.value, "title");
          }}
          placeholder="Add title"
        />
      ),
      inputName: "title",
    },
    {
      title: "Site description",
      description: "Choose regions from where ",
      layout: "vertical",
      input: (
        <Input
          onChange={(e) => {
            onUpdateBrandConfig(e.currentTarget.value, "description");
          }}
          placeholder="Add description"
        />
      ),
      inputName: "description",
    },
    {
      title: "Accent color",
      layout: "vertical",

      description: "Primary color used in your theme",
      input: (
        <ColorPicker
          onChange={(e) => {
            onUpdateBrandConfig(e.toHexString(), "brandColor");
          }}
          className={styles.form__color__picker}
          defaultValue={DEFAULT_THEME.brand.brandColor}
          disabledAlpha
        />
      ),
      inputName: "brandColor",
    },

    {
      title: "Brand icon",

      description: "A square social icon at least 60 x 60.",
      layout: "vertical",

      input: (
        <ImgCrop rotationSlider aspect={1 / 1}>
          <Upload showUploadList={false} maxCount={1} beforeUpload={(file: RcFile) => beforeUpload(file, "icon")}>
            {brandImage.icon === "" ? (
              <Button icon={<UploadOutlined />} style={{ width: 60, height: 60 }}></Button>
            ) : (
              <Tooltip title="Upload icon">
                <Image
                  src={`${brandConfig?.icon}`}
                  height={60}
                  width={60}
                  alt="image"
                  style={{ cursor: "pointer", border: "1px solid var(--border-color)" }}
                />
              </Tooltip>
            )}
          </Upload>
        </ImgCrop>
      ),
      inputName: "icon",
    },
    {
      title: "Brand logo",
      layout: "vertical",

      description: "The primary logo should be transparent and at least 600 x 72px.",
      input: (
        <ImgCrop rotationSlider aspect={2 / 1}>
          <Upload showUploadList={false} maxCount={1} beforeUpload={(file: RcFile) => beforeUpload(file, "logo")}>
            {brandImage.logo === "" ? (
              <Button icon={<UploadOutlined />} style={{ width: 100 }}>
                Logo
              </Button>
            ) : (
              <Tooltip title="Upload logo">
                <Image
                  src={`${brandConfig?.logo}`}
                  height={100}
                  width={200}
                  alt="image"
                  style={{ cursor: "pointer" }}
                />
              </Tooltip>
            )}
          </Upload>
        </ImgCrop>
      ),
      inputName: "logo",
    },

    {
      title: "Social links",
      optional: true,
      description: "Add social links ",
      layout: "vertical",
      input: (
        <Flex vertical gap={10}>
          <Segmented
            className={`${styles.segment} segment__wrapper`}
            onChange={(value) => {
              setSelectedSegment(value);

              form.setFieldValue(
                "social",
                config.brand?.socialLinks && config.brand?.socialLinks[value as keyof ISocialLinks]
              );
            }}
            style={{ lineHeight: 0 }}
            options={[
              {
                label: (
                  <Flex align="center" justify="center">
                    <i>{SvgIcons.discord}</i>
                  </Flex>
                ),
                className: styles.segment__labels,

                value: "discord",
              },
              {
                label: <i>{SvgIcons.github}</i>,
                value: "github",
                className: styles.segment__labels,
              },
              {
                label: <i>{SvgIcons.youtube}</i>,
                value: "youtube",
                className: styles.segment__labels,
              },
              {
                label: <i>{SvgIcons.instagram}</i>,
                value: "instagram",
                className: styles.segment__labels,
              },
              {
                label: <i>{SvgIcons.twitter}</i>,
                value: "twitter",
                className: styles.segment__labels,
              },
            ]}
          />
          <Form.Item name={"social"}>
            <Input
              name="social"
              addonBefore={`https://${selectedSegment}.com`}
              type="url"
              onChange={(e) => {
                onUpdateBrandConfig(
                  e.currentTarget.value === "" ? "" : `https://${selectedSegment}.com/${e.currentTarget.value}`,
                  `socialLinks.${selectedSegment}`
                );
              }}
              defaultValue={
                config?.brand?.socialLinks ? config.brand.socialLinks[selectedSegment as keyof ISocialLinks] : ""
              }
              placeholder={`Add ${selectedSegment} link`}
            />
          </Form.Item>
        </Flex>
      ),
      inputName: "",
    },
  ];

  return (
    <div className={styles.brand__wrapper}>
      <Form
        form={form}
        requiredMark={false}
        initialValues={{
          brandColor: config.brand?.brandColor,
          name: config.brand?.name,
          title: config.brand?.title,
          description: config.brand?.description,
          social: config?.brand?.socialLinks ? config.brand.socialLinks[selectedSegment as keyof ISocialLinks] : "",
        }}
      >
        {brandItems.map((item, i) => {
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
                divider={i === brandItems.length - 1 ? false : true}
                inputName={""}
                optional={item.optional}
              />
              {brandItems.length !== i + 1 && <Divider style={{ margin: "0px 0px 15px 0px" }} />}
            </>
          );
        })}
      </Form>
    </div>
  );
};

export default BrandForm;
