import React, { FC, useEffect, useState } from "react";
import styleLayout from "@/styles/Dashboard.module.scss";
import styles from "@/styles/Profile.module.scss";
import { useSession } from "next-auth/react";

import { Button, Form, Input, Tabs, TabsProps, message, Tooltip, Upload, InputNumber } from "antd";
import { GetServerSidePropsContext, NextPage } from "next";
import { Session } from "next-auth";
import SpinLoader from "@/components/SpinLoader/SpinLoader";
import { useAppContext } from "@/components/ContextApi/AppContext";
import { LoadingOutlined, UserOutlined } from "@ant-design/icons";
import SvgIcons from "@/components/SvgIcons";
import ImgCrop from "antd-img-crop";
import PaymentHistory from "@/components/Admin/Users/PaymentHistory";
import AppLayout from "@/components/Layouts/AppLayout";
import { getSiteConfig } from "@/services/getSiteConfig";
import { PageSiteConfig } from "@/services/siteConstant";
import { getBase64 } from "@/lib/utils";
import ProgramService from "@/services/ProgramService";
import { useRouter } from "next/router";

const ProfileSetting: FC<{
  user: Session;
  active: boolean;
  onUpdateProfile: (info: { name: string; phone: string; image: string }) => void;
  setUserProfile: (profile: string) => void;
  setFile: (file: File) => void;
  userProfile: string;
  updateLoading: boolean;
}> = ({ user, onUpdateProfile, active, userProfile, setUserProfile, setFile, updateLoading }) => {
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [userProfileUploading, setuserProfileUploading] = useState<boolean>(false);
  const router = useRouter();
  const uploadFile = async (file: any, title: string) => {
    if (file) {
      const base64 = await getBase64(file);
      setuserProfileUploading(true);
      setUserProfile(base64 as string);
      setFile(file);
      setuserProfileUploading(false);
    }
  };
  useEffect(() => {
    setPageLoading(true);
    if (user && active) {
      setUserProfile(String(user.user?.image));
      setPageLoading(false);
    }
    setPageLoading(false);
  }, [active]);

  return (
    <>
      {pageLoading ? (
        <>
          <SpinLoader />
        </>
      ) : (
        <section className={styles.user_profile_page}>
          <div className={styles.content_center}>
            <div className={styles.left_content}>
              <Form.Item name="image">
                <ImgCrop rotationSlider>
                  <Upload
                    name="avatar"
                    listType="picture-card"
                    className={styles.upload__thumbnail}
                    showUploadList={false}
                    style={{ width: 150, height: 150 }}
                    beforeUpload={(file) => {
                      uploadFile(file, `${user.user?.name}_profile`);
                    }}
                  >
                    {userProfile !== "NULL" ? (
                      <>
                        <img src={userProfile ? userProfile : String(user.user?.image)} />

                        <Tooltip title="Upload Profile image">
                          <div className={styles.camera_btn_img}>
                            {userProfileUploading && userProfile ? <LoadingOutlined /> : SvgIcons.camera}
                          </div>
                        </Tooltip>
                        <div className={styles.bannerStatus}>{userProfileUploading && "Uploading"}</div>
                      </>
                    ) : (
                      <button
                        className={styles.upload_img_button}
                        style={{ border: 0, background: "none", width: 150, height: 150 }}
                        type="button"
                      >
                        {userProfileUploading ? <LoadingOutlined /> : SvgIcons.camera}
                        {!userProfileUploading ? (
                          <div>Upload Image</div>
                        ) : (
                          <div style={{ color: "#000" }}>{userProfileUploading && "Uploading"}</div>
                        )}
                      </button>
                    )}
                  </Upload>
                </ImgCrop>
              </Form.Item>
            </div>
            <div className={styles.right_content}>
              <Form
                className={styles.user_profile_form}
                initialValues={{
                  name: user?.user?.name,
                  email: user?.user?.email,
                  phone: user.phone && Number(user?.phone),
                }}
                onFinish={onUpdateProfile}
                layout="vertical"
                requiredMark={false}
              >
                <Form.Item label="Name" name="name" rules={[{ required: true, message: "Required Name" }]}>
                  <Input placeholder="Name" />
                </Form.Item>
                <Form.Item label="Email" name="email">
                  <Input placeholder="Email" disabled={true} />
                </Form.Item>

                <Form.Item
                  label="Phone"
                  name="phone"
                  rules={[
                    { required: true, message: "Please enter phone" },
                    { type: "number", min: 1000000000, max: 9999999999, message: "Invalid phone number" },
                  ]}
                >
                  <InputNumber addonBefore="+91" placeholder="9999000099" />
                </Form.Item>
                <Form.Item noStyle>
                  <Button loading={updateLoading} type="primary" htmlType="submit">
                    Update
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

const Setting: NextPage<{ siteConfig: PageSiteConfig }> = ({ siteConfig }) => {
  const { data: user, update } = useSession();
  const router = useRouter();

  const [messageApi, contextMessageHolder] = message.useMessage();
  const [userProfile, setUserProfile] = useState<string>();
  let active = router.query.tab && typeof router.query.tab === "string" ? router.query.tab : "profile";
  const [activeKey, setActiveKey] = useState<string>(active);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);

  const [file, setFile] = useState<File>();
  const { dispatch, globalState } = useAppContext();

  const onChange = (key: string) => {
    switch (key) {
      case "profile":
        setActiveKey("profile");
        return router.push(`/setting?tab=${key}`);

      case "payment":
        setActiveKey("payment");
        return router.push(`/setting?tab=${key}`);

      default:
        return setActiveKey("profile");
    }
  };
  const onUpdateProfile = async (info: { name: string; phone: string; image: string }) => {
    setUpdateLoading(true);
    const formData = new FormData();
    formData.append("userInfo", JSON.stringify({ name: info.name, phone: info.phone, image: user?.user?.image }));
    file && formData.append("file", file);

    ProgramService.updateProfile(
      formData,
      (result) => {
        update({
          ...info,
          image: result.fileCDNPath,
        });
        dispatch({ type: "SET_USER", payload: { name: info.name, phone: `${info.phone}` } });
        messageApi.success(result.message);
        setUpdateLoading(false);
      },
      (error) => {
        setUpdateLoading(false);

        messageApi.error(error);
      }
    );
  };

  const items: TabsProps["items"] = [
    {
      key: "profile",
      label: "Profile",
      children: user && (
        <ProfileSetting
          user={user}
          active={activeKey !== "payment"}
          onUpdateProfile={onUpdateProfile}
          userProfile={String(userProfile)}
          setUserProfile={setUserProfile}
          setFile={setFile}
          updateLoading={updateLoading}
        />
      ),
    },
    {
      key: "payment",
      label: "Payment",
      children: user && <PaymentHistory active={activeKey === "payment"} />,
    },
  ];

  return (
    <AppLayout siteConfig={siteConfig}>
      {contextMessageHolder}

      <section className={styleLayout.setting_content}>
        <h3>Setting</h3>
        <Tabs defaultActiveKey={activeKey} className="content_tab" items={items} onChange={onChange} />
      </section>
    </AppLayout>
  );
};

export default Setting;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const siteConfig = getSiteConfig();
  const { site } = siteConfig;
  return {
    props: {
      siteConfig: site,
    },
  };
};
