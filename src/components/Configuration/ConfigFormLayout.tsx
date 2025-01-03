import { FC } from "react";

import styles from "./CMS/CMS.module.scss";
import { Collapse } from "antd";

const ConfigFormLayout: FC<{
  children?: React.ReactNode;
  formTitle: string;
  extraContent?: React.ReactNode;
  isCollapsible?: boolean;
  width?: string;
  marginBottom?: string;
}> = ({ children, formTitle, extraContent, isCollapsible = false, width = "1000px", marginBottom }) => {
  return (
    <section className={styles.cms__container} style={{ width, marginBottom }}>
      <Collapse
        style={{ borderRadius: 4 }}
        defaultActiveKey={[formTitle]}
        collapsible={isCollapsible ? "header" : "icon"}
      >
        <Collapse.Panel
          header={<h4 style={{ margin: 0 }}>{formTitle}</h4>}
          key={formTitle}
          extra={extraContent}
          showArrow={isCollapsible}
        >
          {children}
        </Collapse.Panel>
      </Collapse>
    </section>
  );
};

export default ConfigFormLayout;
