import React, { FC, useEffect, useState } from "react";
import styleLayout from "../styles/Dashboard.module.scss";
import styles from "@/styles/Profile.module.scss";
import { useSession } from "next-auth/react";
import Layout2 from "@/components/Layouts/Layout2";
import { Button, Form, Input, Tabs, Spin, TabsProps, message, Avatar, Tooltip, Upload } from "antd";
import { postFetch, IResponse, postWithFile } from "@/services/request";
import { NextPage } from "next";
import { Session } from "next-auth";
import SpinLoader from "@/components/SpinLoader/SpinLoader";
import { useAppContext } from "@/components/ContextApi/AppContext";
import { LoadingOutlined, UserOutlined } from "@ant-design/icons";
import SvgIcons from "@/components/SvgIcons";
import ImgCrop from "antd-img-crop";

const ProfileSetting: FC<{
  user: Session;
  onUpdateProfile: (info: { name: string; phone: string; image: string }) => void;
  setUserProfile: (profile: string) => void;
  userProfile: string;
}> = ({ user, onUpdateProfile, userProfile, setUserProfile }) => {
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [userProfileUploading, setuserProfileUploading] = useState<boolean>(false);

  const uploadFile = async (file: any, title: string) => {
    if (file) {
      setuserProfileUploading(true);
      const name = title.replace(/\s+/g, "-");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", name);
      formData.append("dir", "/user/profile/");
      formData.append("existingFilePath", userProfile);

      const postRes = await postWithFile(formData, `/api/v1/upload/file/upload`);
      if (!postRes.ok) {
        message.error(postRes.statusText);
      }
      const res = await postRes.json();

      if (res.success) {
        setUserProfile(res.fileCDNPath);
        setuserProfileUploading(false);
      } else {
        message.error(res.error);
      }
    }
  };
  useEffect(() => {
    setPageLoading(true);
    if (user) {
      setUserProfile(String(user.user?.image));
      setPageLoading(false);
    }
  }, []);

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
                    // onChange={handleChange}
                  >
                    {userProfile !== "NULL" ? (
                      <>
                        <img
                          style={{ borderRadius: "50%", objectFit: "cover", width: 150, height: 150 }}
                          src={userProfile ? userProfile : String(user.user?.image)}
                        />

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
                  phone: user?.phone,
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
                <Form.Item label="Phone" name="phone">
                  <Input placeholder="Phone" min={0} maxLength={12} />
                </Form.Item>
                <Form.Item noStyle>
                  <Button type="primary" htmlType="submit">
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

const Setting: NextPage = () => {
  const { data: user, update } = useSession();
  const [messageApi, contextMessageHolder] = message.useMessage();
  const [userProfile, setUserProfile] = useState<string>();
  const { dispatch, globalState } = useAppContext();

  const onChange = (key: string) => {};
  const onUpdateProfile = async (info: { name: string; phone: string; image: string }) => {
    const res = await postFetch(
      { name: info.name, userId: user?.id, phone: info.phone, image: userProfile },
      "/api/user/update"
    );
    const result = (await res.json()) as IResponse;
    if (res.ok && result.success) {
      update({
        ...info,
        image: userProfile,
      });
      dispatch({ type: "SET_USER", payload: { name: info.name, phone: info.phone, theme: globalState.theme } });
      messageApi.success(result.message);
    } else {
      messageApi.error(result.error);
    }
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Profile",
      children: user && (
        <ProfileSetting
          user={user}
          onUpdateProfile={onUpdateProfile}
          userProfile={String(userProfile)}
          setUserProfile={setUserProfile}
        />
      ),
    },
  ];

  return (
    <Layout2>
      {contextMessageHolder}

      <section className={styleLayout.setting_content}>
        <h2>Hello {user?.user?.name}</h2>
        <h3>Setting</h3>

        <Tabs defaultActiveKey="1" className="content_tab" items={items} onChange={onChange} />
      </section>
    </Layout2>
  );
};

export default Setting;
