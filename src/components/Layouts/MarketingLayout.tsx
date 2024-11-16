import { FC, ReactNode, useEffect, useState } from "react";
import React from "react";
import styles from "@/components/Marketing/LandingPage/Hero/Hero.module.scss";
import Head from "next/head";
import { useAppContext } from "../ContextApi/AppContext";
import { ConfigProvider, Flex } from "antd";
import Link from "next/link";
import darkThemConfig from "@/services/darkThemConfig";
import antThemeConfig from "@/services/antThemeConfig";
import SpinLoader from "../SpinLoader/SpinLoader";
import SideNav from "../Marketing/LandingPage/NavBar/SideNavBar";
import NavBar from "../Marketing/LandingPage/NavBar/NavBar";
import Image from "next/image";
import Hamburger from "hamburger-react";
import Footer from "../Marketing/LandingPage/Footer/Footer";
import config from "../../theme.config";
import { Theme, User } from "@prisma/client";
import { useThemeConfig } from "../ContextApi/ThemeConfigContext";
import { PageThemeConfig } from "@/services/themeConstant";
import { onChangeTheme } from "@/lib/utils";
import { IBrandInfo } from "@/types/courses/navbar";

const MarketingLayout: FC<{
  children?: React.ReactNode;
  heroSection?: React.ReactNode;
  themeConfig: PageThemeConfig;
  user?: User;
}> = ({ children, heroSection, user, themeConfig }) => {
  const { globalState, dispatch } = useAppContext();
  const [showSideNav, setSideNav] = useState(false);
  const onAnchorClick = () => {
    setSideNav(false);
  };

  const { brand } = useThemeConfig();
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--btn-primary", `${brand?.brandColor}`);
  }, []);

  useEffect(() => {
    onChangeTheme(dispatch, themeConfig.darkMode);
  }, []);
  return (
    <>
      {
        <div
          style={{
            position: "fixed",
            display: globalState.pageLoading || !themeConfig.brand?.title ? "unset" : "none",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: "100%",
            background: "#fff",
            zIndex: 10,
          }}
        >
          <SpinLoader className="marketing__spinner" />
        </div>
      }
      <ConfigProvider theme={globalState.theme == "dark" ? darkThemConfig() : antThemeConfig()}>
        <Head>
          <title>
            {themeConfig.brand?.title} | {themeConfig.brand?.name}
          </title>
          <meta name="description" content={themeConfig.brand?.description} />
          <meta property="og:image" content={themeConfig.brand?.ogImage} />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

          <link rel="icon" href={themeConfig.brand?.favicon} />
        </Head>

        <section className={styles.heroWrapper}>
          <NavBar
            user={user}
            items={themeConfig.navBar?.navigationLinks ? themeConfig.navBar.navigationLinks : []}
            showThemeSwitch={themeConfig.darkMode as boolean}
            activeTheme={globalState.theme as Theme}
            brand={themeConfig?.brand as { name: string; logo: ReactNode | string }}
          />
          <SideNav
            isOpen={showSideNav}
            onAnchorClick={onAnchorClick}
            items={themeConfig.navBar?.navigationLinks ? themeConfig.navBar.navigationLinks : []}
            showThemeSwitch={themeConfig.darkMode as boolean}
            activeTheme={globalState.theme as Theme}
            brand={themeConfig.brand as IBrandInfo}
          />
          <Link href={"/"} className={styles.platformNameLogo}>
            <Flex align="center" gap={5}>
              <Image src={`${themeConfig.brand?.logo}`} height={40} width={40} alt={"logo"} loading="lazy" />
              <h4 className="font-brand">{themeConfig.brand?.name?.toUpperCase()}</h4>
            </Flex>
          </Link>

          <div role="button" className={styles.hamburger} aria-label="Toggle menu">
            <Hamburger
              rounded
              direction="left"
              toggled={showSideNav}
              onToggle={(toggle: boolean | ((prevState: boolean) => boolean)) => {
                setSideNav(toggle);
              }}
            />
          </div>
          {heroSection}
        </section>
        <div className={styles.children_wrapper}>{children}</div>
        <Footer />
      </ConfigProvider>
    </>
  );
};

export default MarketingLayout;
