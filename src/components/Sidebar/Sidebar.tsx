import React, { FC } from "react";
import styles from "../../styles/Sidebar.module.scss";
import { Avatar, Badge, Layout, Menu, MenuProps, Space, message } from "antd";
import { DashOutlined, UserOutlined } from "@ant-design/icons";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import SvgIcons from "../SvgIcons";
import { ISiderMenu, useAppContext } from "../ContextApi/AppContext";
import { IResponse, getFetch } from "@/services/request";
const { Sider } = Layout;

const Sidebar: FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [isNewNotifi, setNewNotifi] = React.useState(false);

  const { data: user } = useSession();
  const { globalState, dispatch } = useAppContext();

  const getNewNotification = async (userId: number) => {
    try {
      const res = await getFetch(`/api/notification/check/${user?.id}`);
      const result = (await res.json()) as IResponse;
      if (res.ok && result.success) {
        setNewNotifi(result.notifications);
      } else {
        message.error(result.error);
      }
    } catch (err: any) {
      console.log("Error while fetching Notification status");
    }
  };

  const siderMenu: MenuProps["items"] = [
    {
      type: "group",
      label: "LEARN",
      key: "group1",
    },
    {
      label: <Link href="dashboard">Dashboard</Link>,
      key: "dashboard",
      icon: SvgIcons.dashboard,
    },
    {
      label: <Link href="courses">Courses</Link>,
      key: "courses",
      icon: SvgIcons.courses,
    },
    {
      label: "Guides",
      key: "guides",
      icon: SvgIcons.guides,
    },
    {
      label: "Quiz",
      key: "quiz",
      icon: SvgIcons.quiz,
    },
    {
      type: "group",
      label: "ACCOUNT",
    },
    {
      label: <Link href="/torq/setting">Setting</Link>,
      key: "setting",
      icon: SvgIcons.setting,
    },
    {
      label: <Link href="/torq/notifications">Notifications</Link>,
      key: "notification",
      icon: (
        <Badge color="blue" dot={!isNewNotifi}>
          {SvgIcons.nottification}
        </Badge>
      ),
    },
    {
      type: "group",
      label: "ADMINISTRATION",
      key: "administration",
    },
    {
      label: <Link href="/admin/users">Users</Link>,
      key: "users",
      icon: SvgIcons.userGroup,
    },
    {
      label: <Link href="/admin/content/settings">Content</Link>,
      key: "content",
      icon: SvgIcons.content,
    },
    {
      label: "Configurations",
      key: "configuration",
      icon: SvgIcons.configuration,
    },
  ];

  React.useEffect(() => {
    if (user?.id) {
      getNewNotification(user.id);
    }
  }, [user?.id]);

  return (
    <Sider
      width={260}
      theme="light"
      className={`${styles.main_sider} main_sider`}
      trigger={null}
      collapsible
      collapsed={collapsed}
    >
      <div>
        <div className={styles.logo}>
          <Link href="/programs">
            <Image src="/img/dark-logo.png" alt="torqbit" width={130} height={30} />
          </Link>
        </div>
        <Menu
          mode="inline"
          onSelect={(value) => dispatch({ type: "SET_SELECTED_SIDER_MENU", payload: value.key as ISiderMenu })}
          defaultSelectedKeys={["dashboard"]}
          selectedKeys={[globalState.selectedSiderMenu]}
          style={{ width: "100%" }}
          items={siderMenu}
        />
      </div>
      <Space direction="horizontal" className={styles.user_profile}>
        <Space align={collapsed ? "center" : "start"}>
          <Avatar icon={<UserOutlined />} />
          {!collapsed && (
            <div>
              <h4>{user?.user?.name}</h4>
              <h5>{user?.user?.email}</h5>
            </div>
          )}
        </Space>
        {!collapsed && SvgIcons.threeDots}
      </Space>
    </Sider>
  );
};

export default Sidebar;
