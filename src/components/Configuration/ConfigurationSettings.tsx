import AppLayout from "@/components/Layouts/AppLayout";
import { Tabs, TabsProps } from "antd";

import ContentManagementSystem from "@/components/Configuration/CMS/ContentManagementSystem";
import { FC } from "react";
import { PageSiteConfig } from "@/services/siteConstant";

const ConfigurationSettings: FC<{ siteConfig: PageSiteConfig }> = ({ siteConfig }) => {
  const items: TabsProps["items"] = [
    {
      key: "CMS",
      label: "Content Management System",
      children: <ContentManagementSystem />,
    },
    {
      key: "PMS",
      label: "Payment Management System",
      children: (
        <>
          <h3>Payment Management System</h3>
        </>
      ),
    },
  ];
  return (
    <AppLayout siteConfig={siteConfig}>
      <div style={{ padding: "20px 40px" }}>
        <Tabs
          tabBarGutter={60}
          tabBarStyle={{
            borderColor: "gray",
          }}
          defaultActiveKey={"CMS"}
          items={items}
        />
      </div>
    </AppLayout>
  );
};

export default ConfigurationSettings;