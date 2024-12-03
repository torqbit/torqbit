import SiteBuilderLayout from "@/components/Layouts/SiteBuilderLayout";
import PreviewSite from "@/components/PreviewCode/PreviewSite";
import SiteBuilderSideBar from "@/components/SiteBuilder/SiteBuilderSideBar";
import { getSiteConfig } from "@/services/getSiteConfig";
import { DEFAULT_THEME, PageSiteConfig } from "@/services/siteConstant";
import { GetServerSidePropsContext, NextPage } from "next";
import { useRef, useState } from "react";

const SiteDesign: NextPage<{ siteConfig: PageSiteConfig }> = ({ siteConfig }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [config, setConfig] = useState<PageSiteConfig>({
    ...DEFAULT_THEME,
    brand: {
      ...DEFAULT_THEME.brand,
      name: siteConfig.brand?.name,
      title: siteConfig.brand?.title,
      description: siteConfig.brand?.description,
      brandColor: siteConfig.brand?.brandColor,
    },
  });

  const sendMessageToIframe = (info: string, key: string) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "SITE_CONFIG",
          payload: {
            ...config,
            brand: {
              ...config.brand,
              [key]: info,
            },
          },
        },
        `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}`
      );
      setConfig({
        ...config,
        brand: {
          ...config.brand,
          [key]: info,
        },
      });
    }
  };

  return (
    <SiteBuilderLayout
      siteConfig={config}
      sideBar={<SiteBuilderSideBar config={config} OnUpdateConfig={sendMessageToIframe} />}
    >
      <PreviewSite ref={iframeRef} />
    </SiteBuilderLayout>
  );
};

export default SiteDesign;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const siteConfig = getSiteConfig();
  return {
    props: {
      siteConfig: siteConfig.site,
    },
  };
};