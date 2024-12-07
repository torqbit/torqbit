import { FC, useEffect, useState } from "react";
import styles from "./HeroForm.module.scss";
import { Button, Divider, Flex, Form, Input, message, Radio, Tooltip, Upload } from "antd";
import ConfigForm from "@/components/Configuration/ConfigForm";
import { IConfigForm } from "@/components/Configuration/CMS/ContentManagementSystem";
import { UploadOutlined } from "@ant-design/icons";
import { PageSiteConfig } from "@/services/siteConstant";
import { IHeroConfig } from "@/types/schema";
import Image from "next/image";
import ImgCrop from "antd-img-crop";
import { postWithFile } from "@/services/request";
import { getExtension } from "@/lib/utils";

const HeroForm: FC<{
  config: PageSiteConfig;
  updateSiteConfig: (config: PageSiteConfig) => void;
}> = ({ updateSiteConfig, config }) => {
  const [form] = Form.useForm();
  const [heroConfig, setHeroConfig] = useState<IHeroConfig | undefined>(config.heroSection);
  const [heroImages, setHeroImages] = useState<{ lightModePath: string; darkModePath: string }>({
    lightModePath: heroConfig?.banner?.lightModePath ? heroConfig.banner.lightModePath : "",
    darkModePath: heroConfig?.banner?.darkModePath ? heroConfig.banner.darkModePath : "",
  });

  const beforeUpload = async (file: File, mode: string) => {
    const getImageName = () => {
      if (mode === "lightModePath") {
        const name = heroConfig?.banner?.lightModePath?.split("/").pop();
        return name as string;
      } else if (mode === "darkModePath") {
        const name = heroConfig?.banner?.darkModePath?.split("/").pop();
        return name as string;
      } else {
        return "";
      }
    };
    try {
      if (file) {
        const imgName = `${mode}.${getExtension(file.name)}`;
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
          setHeroImages({ ...heroImages, [mode]: `/static/${res.imgName}` });
          setHeroConfig({
            ...heroConfig,
            banner: { ...heroConfig?.banner, [mode]: `/static/${res.imgName}` },
          });
        }
      }
    } catch (error) {
      message.error(`Error uploading file: ${file.name}`);
    }
    return false;
  };

  const onUpdateHeroConfig = (value: string, key: string) => {
    if (key.startsWith("actionButtons")) {
      const buttonType = key.split(".")[1];
      const buttonKey = key.split(".")[2];
      if (buttonType === "primary") {
        setHeroConfig({
          ...heroConfig,
          actionButtons: {
            ...heroConfig?.actionButtons,
            primary: { ...heroConfig?.actionButtons?.primary, [buttonKey]: value },
          },
        });
      } else {
        setHeroConfig({
          ...heroConfig,
          actionButtons: {
            ...heroConfig?.actionButtons,
            secondary: { ...heroConfig?.actionButtons?.secondary, [buttonKey]: value },
          },
        });
      }
    } else {
      setHeroConfig({ ...heroConfig, [key]: value });
    }
  };

  useEffect(() => {
    updateSiteConfig({ ...config, heroSection: heroConfig });
  }, [heroConfig]);

  const heroItems: IConfigForm[] = [
    {
      title: "Title",
      description: "Add title for the hero section ",
      layout: "vertical",
      input: (
        <Input
          onChange={(e) => {
            onUpdateHeroConfig(e.currentTarget.value, "title");
          }}
          placeholder="Add title "
        />
      ),
      inputName: "title",
    },
    {
      title: "Description",
      description: "Add description for hero section ",
      layout: "vertical",
      input: (
        <Input
          onChange={(e) => {
            onUpdateHeroConfig(e.currentTarget.value, "description");
          }}
          placeholder="Add description"
        />
      ),
      inputName: "description",
    },
    {
      title: "Action buttons",
      description: "Add actions buttons ",
      layout: "vertical",
      input: (
        <Flex vertical gap={10}>
          <Flex vertical gap={10}>
            <h5>Primary</h5>
            <Input
              defaultValue={config.heroSection?.actionButtons?.primary?.label}
              onChange={(e) => {
                onUpdateHeroConfig(e.currentTarget.value, "actionButtons.primary.label");
              }}
              placeholder="Add label"
            />
            <Input
              defaultValue={config.heroSection?.actionButtons?.primary?.link}
              addonBefore="https://"
              onChange={(e) => {
                onUpdateHeroConfig(`/${e.currentTarget.value}`, "actionButtons.primary.link");
              }}
              placeholder="Add link"
            />
          </Flex>
          <Flex vertical gap={10}>
            <h5>Secondary</h5>
            <Input
              defaultValue={config.heroSection?.actionButtons?.secondary?.label}
              onChange={(e) => {
                onUpdateHeroConfig(e.currentTarget.value, "actionButtons.secondary.label");
              }}
              placeholder="Add label"
            />
            <Input
              defaultValue={config.heroSection?.actionButtons?.secondary?.link}
              addonBefore="https://"
              onChange={(e) => {
                onUpdateHeroConfig(`/${e.currentTarget.value}`, "actionButtons.secondary.link");
              }}
              placeholder="Add link"
            />
          </Flex>
        </Flex>
      ),
      inputName: "actionButtons",
    },
    {
      title: "Hero image",
      layout: "vertical",

      description: "The hero image should be  at least 1200 x 600px.",
      input: (
        <Flex align="center" vertical gap={20}>
          <ImgCrop rotationSlider aspect={2 / 1}>
            <Upload maxCount={1} showUploadList={false} beforeUpload={(file) => beforeUpload(file, "lightModePath")}>
              {heroImages.lightModePath === "" ? (
                <Button icon={<UploadOutlined />} style={{ width: 240, height: 120 }}>
                  Light Hero banner
                </Button>
              ) : (
                <Tooltip title="Upload light mode banner">
                  <Image
                    src={`${heroConfig?.banner?.lightModePath}`}
                    height={120}
                    width={240}
                    alt="image"
                    style={{ cursor: "pointer" }}
                  />
                </Tooltip>
              )}
            </Upload>
          </ImgCrop>
          {config.darkMode && (
            <ImgCrop rotationSlider aspect={2 / 1}>
              <Upload maxCount={1} showUploadList={false} beforeUpload={(file) => beforeUpload(file, "darkModePath")}>
                {heroImages.darkModePath === "" ? (
                  <Button icon={<UploadOutlined />} style={{ width: 240, height: 120 }}>
                    Dark Hero banner
                  </Button>
                ) : (
                  <Tooltip title="Upload dark mode banner">
                    <Image
                      src={`${heroConfig?.banner?.darkModePath}`}
                      height={120}
                      width={240}
                      alt="image"
                      style={{ cursor: "pointer" }}
                    />
                  </Tooltip>
                )}
              </Upload>
            </ImgCrop>
          )}
        </Flex>
      ),
      inputName: "logo",
    },
    {
      title: "Image position",
      layout: "vertical",

      description: "Select the position of the image",
      input: (
        <Flex vertical gap={10}>
          <Flex gap={62}>
            <Radio
              checked={heroConfig?.banner?.position === "left"}
              onChange={(e) => {
                setHeroConfig({ ...heroConfig, banner: { ...heroConfig?.banner, position: "left" } });
              }}
              title="Left"
            >
              Left
            </Radio>
            <Radio
              checked={heroConfig?.banner?.position === "right"}
              onChange={(e) => {
                setHeroConfig({ ...heroConfig, banner: { ...heroConfig?.banner, position: "right" } });
              }}
              title="Left"
            >
              Right
            </Radio>
          </Flex>{" "}
          <Flex gap={40}>
            <Radio
              checked={heroConfig?.banner?.position === "bottom"}
              onChange={(e) => {
                setHeroConfig({ ...heroConfig, banner: { ...heroConfig?.banner, position: "bottom" } });
              }}
              title="Left"
            >
              Bottom
            </Radio>

            <Radio
              checked={heroConfig?.banner?.position === "background"}
              onChange={(e) => {
                setHeroConfig({ ...heroConfig, banner: { ...heroConfig?.banner, position: "background" } });
              }}
              title="Left"
            >
              Background
            </Radio>
          </Flex>
        </Flex>
      ),
      inputName: "position",
    },
  ];
  return (
    <div className={styles.add__hero__wrapper}>
      <Form
        form={form}
        requiredMark={false}
        initialValues={{
          title: config.heroSection?.title,
          description: config.heroSection?.description,
        }}
      >
        {heroItems.map((item, i) => {
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
                divider={i === heroItems.length - 1 ? false : true}
                inputName={""}
                optional={item.optional}
              />
              {heroItems.length !== i + 1 && <Divider style={{ margin: "0px 0px 15px 0px" }} />}
            </>
          );
        })}
      </Form>
    </div>
  );
};

export default HeroForm;
