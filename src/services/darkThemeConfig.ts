import { Theme } from "@/types/theme";
import { PageSiteConfig } from "./siteConstant";
import { IBrandConfig } from "@/types/schema";

export const getIconTheme = (
  theme: Theme,
  brand?: IBrandConfig
): { bgColor: string; brandColor: string; fontColor: string } => {
  switch (theme) {
    case "dark":
      return {
        bgColor: "#283040",
        fontColor: "#939db8",
        brandColor: brand?.brandColor || "blue",
      };
    case "light":
      return {
        bgColor: "#fff",
        fontColor: "#666",
        brandColor: brand?.brandColor || "blue",
      };
    default:
      return {
        bgColor: "#fff",
        fontColor: "#666",
        brandColor: brand?.brandColor || "blue",
      };
  }
};

const darkThemeConfig = (siteConfig: PageSiteConfig) => {
  return {
    token: {
      borderRadius: 4,
      colorText: "#939db8",
      colorBgContainer: "#283040",
      colorBorder: "#374362",
      colorTextPlaceholder: "#666",
      colorPrimary: `${siteConfig.brand?.brandColor}`,
      colorSplit: "#2f3647",
      hoverBorderColor: `${siteConfig.brand?.brandColor}`,
      activeBorderColor: `${siteConfig.brand?.brandColor}`,
      colorTextDisabled: "#939db8",
      colorTextDescription: "#939db8",
    },

    Badge: {
      colorInfo: `${siteConfig.brand?.brandColor}`,
    },

    components: {
      Layout: {
        bodyBg: "#202433",
      },
      Steps: {
        colorSplit: "#2f3647",
      },
      Statistic: {
        contentFontSize: 12,
        titleFontSize: 12,
        marginXXS: 0,
        colorTextDescription: "#fff",
      },
      Progress: {
        remainingColor: "#d4d4d4",
        defaultColor: `${siteConfig.brand?.brandColor}`,
      },
      Tree: {
        nodeSelectedBg: "#283040",
        directoryNodeSelectedBg: "#283040",
        directoryNodeSelectedColor: "#fff",
      },
      Menu: {
        itemColor: "#939db8",
        groupTitleColor: "#eee",
        itemActiveBg: "#202433",
        itemSelectedBg: "#202433",
        itemSelectedColor: "#fff",
        itemBg: "#283040",
      },
      Radio: {
        buttonSolidCheckedActiveBg: "#000",
        buttonSolidCheckedBg: "#000",
        buttonSolidCheckedHoverBg: "#000",
        colorBorder: "#68696d",
      },
      Sider: {
        color: "#666",
      },
      Divider: {
        colorSplit: "#374362",
      },
      Popover: {
        colorBgElevated: "#283040",
      },
      Card: {
        paddingLG: 20,
        colorBorderSecondary: "#2f3647",
      },
      Form: {
        labelColor: "#888",
      },
      Button: {
        defaultBg: "#283040",
        groupBorderColor: "#000",
        colorPrimaryActive: "#fff",
      },
      Input: {
        borderRadius: 4,
        activeShadow: "none",
        activeBg: "#222938",
        hoverBg: "#222938",
        addonBg: "#383e4b",

        colorTextPlaceholder: "#939db8",
        activeBorderColor: "#939db8",
      },

      Select: {
        activeBorderColor: "#939db8",
        optionSelectedColor: "#939db8",
        optionActiveBg: "#202433",
        colorBgContainer: "#283040",
        colorBgElevated: "#283040",
        optionSelectedBg: "#202433",
        colorTextPlaceholder: "#939db8",
        activeShadow: "none",
      },

      Dropdown: {
        colorPrimary: "#666",
        controlItemBgActive: "#EEE",
        colorText: "#939db8",
        controlItemBgHover: "#283040",
        colorBgElevated: "#202433",
        controlItemBgActiveHover: "#dcdcdc",
      },
      List: {
        colorSplit: "#374362",
      },

      Tabs: {
        inkBarColor: "#fff",
        itemColor: "#939db8",
        itemActiveColor: "#fff",
        itemSelectedColor: "#fff",
        itemHoverColor: "#fff",
        cardBg: "#939db8",
      },

      Drawer: {
        zIndexPopup: 1001,
        padding: 10,
        colorIcon: "#939db8",
        footerPaddingInline: 20,
        footerPaddingBlock: 10,
        paddingLG: 20,
        colorBgElevated: "#283040",
      },
      Tag: {
        defaultBg: "#374362",
        defaultColor: "#939db8",
      },
      Collapse: {
        headerBg: "#283040",
        colorText: "#939db8",
      },
      Table: {
        colorBgContainer: "#283040",
        borderColor: "#2f3647",
        colorText: "#939db8",
        headerSplitColor: "#202433",
      },
      Pagination: {
        colorPrimaryBorder: "#202433",
        colorPrimary: "#939db8",
        colorPrimaryHover: "#939db8",
        colorTextDisabled: "#939db8",
      },
      Modal: {
        contentBg: "#202433",
        colorIcon: "#939db8",
        headerBg: "#202433",
      },
      Switch: {
        colorPrimaryHover: "#68696d",
      },
      Popconfirm: {
        colorTextHeading: "#939db8",
        colorText: "#939db8",
      },
      Message: {
        contentBg: "#283040",
      },
      Breadcrumb: {
        itemColor: "#939db8",
        linkColor: "#fff",
        separatorColor: "#939db8",
      },
      Segmented: {
        itemSelectedBg: "#283040",
        itemHoverColor: "#fff",
        trackBg: "#151823",
        controlPaddingHorizontal: 30,
        itemColor: "#000",
      },
    },
  };
};

export default darkThemeConfig;
