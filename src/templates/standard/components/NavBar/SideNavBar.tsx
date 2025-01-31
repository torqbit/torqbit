import React, { FC, useState } from "react";
import Link from "next/link";
import DOMPurify from "dompurify";

import { Badge, Drawer, Flex } from "antd";
import styles from "./NavBar.module.scss";
import { INavBarProps } from "@/types/landing/navbar";
import ThemeSwitch from "@/components/ThemeSwitch/ThemeSwitch";
import Hamburger from "hamburger-react";
import { Role } from "@prisma/client";
import SvgIcons from "@/components/SvgIcons";
import { IResponsiveNavMenu, useAppContext } from "@/components/ContextApi/AppContext";
import ResponsiveAppNavBar from "./ResponsiveAppNavBar";

const MobileNav: FC<INavBarProps> = ({ items, showThemeSwitch, activeTheme, brand, previewMode, user }) => {
  const [showSideNav, setSideNav] = useState(false);
  const onAnchorClick = () => {
    setSideNav(false);
  };

  const responsiveNav = [
    {
      title: "Dashboard",
      icon: (
        <i style={{ fontSize: 14, color: "var(--font-secondary)", lineHeight: 0 }} className={styles.events_icon}>
          {SvgIcons.dashboard}
        </i>
      ),
      link: "dashboard",
      key: "dashboard",
    },
    {
      title: "Academy",
      icon: (
        <i className={styles.events_icon} style={{ fontSize: 14 }}>
          {SvgIcons.courses}
        </i>
      ),
      link: "courses",
      key: "courses",
    },
    {
      title: "Blogs",
      icon: (
        <i style={{ fontSize: 14 }} className={styles.events_icon}>
          {SvgIcons.blog}
        </i>
      ),
      link: "blogs",
      key: "blogs",
    },
    {
      title: "Events",
      icon: (
        <i style={{ fontSize: 14 }} className={styles.events_icon}>
          {SvgIcons.events}
        </i>
      ),

      link: "events",
      key: "events",
    },
    {
      title: "Settings",
      icon: (
        <i style={{ fontSize: 14, color: "var(--font-secondary)", lineHeight: 0 }} className={styles.events_icon}>
          {SvgIcons.setting}
        </i>
      ),
      link: "setting",
      key: "setting",
    },
  ];
  return (
    <>
      {user?.role === Role.STUDENT ? (
        <div>
          <ResponsiveAppNavBar userRole={Role.STUDENT} menuItems={responsiveNav} />
        </div>
      ) : (
        <>
          <section className={styles.sideNaveContainer}>
            <Drawer
              classNames={{ header: styles.drawerHeader }}
              title={
                <div className={styles.drawerTitle}>
                  <Link href={"/"} aria-label="Go back to landing page">
                    <Flex align="center" gap={5}>
                      {typeof brand?.logo === "string" && typeof brand.darkLogo === "string" ? (
                        <img
                          src={activeTheme == "dark" ? brand?.darkLogo : brand?.logo}
                          style={{ width: "auto", height: 30 }}
                          alt={`logo of ${brand.name}`}
                        />
                      ) : (
                        brand?.logo
                      )}
                      {!brand?.logo && (
                        <Flex align="center" gap={10}>
                          <img
                            src={`${brand?.icon}`}
                            style={{ width: "auto", height: 30 }}
                            alt={`logo of ${brand?.name}`}
                          />
                          <h1 className="font-brand">{brand?.name}</h1>
                        </Flex>
                      )}
                    </Flex>
                  </Link>
                  {showSideNav && showThemeSwitch && (
                    <ThemeSwitch activeTheme={activeTheme} previewMode={previewMode} />
                  )}
                </div>
              }
              placement="left"
              width={300}
              closable={false}
              onClose={onAnchorClick}
              open={showSideNav}
            >
              <div className={styles.menuDrawer}>
                {items &&
                  items.map((item, i) => {
                    return (
                      <div
                        key={i}
                        className={styles.drawerMenuItems}
                        onClick={() => item.title === "Courses" && onAnchorClick()}
                      >
                        {item.title === "Courses" ? (
                          <a
                            href={item.link}
                            style={{ color: "var(--font-secondary)" }}
                            className={styles.menuTitle}
                            aria-label={`link to ${item.title}`}
                          >
                            <div>{item.title}</div>
                          </a>
                        ) : (
                          <Link
                            key={i}
                            style={{ color: "var(--font-secondary)" }}
                            href={DOMPurify.sanitize(item.link)}
                            aria-label={`link to ${item.title}`}
                          >
                            {item.title}
                          </Link>
                        )}
                      </div>
                    );
                  })}
              </div>
            </Drawer>
          </section>
          <div className={styles.responsive__header}>
            <Link href={"/"} className={styles.platformNameLogo} style={{ top: 15 }}>
              <Flex align="center" gap={5}>
                {typeof brand?.logo === "string" && typeof brand.darkLogo === "string" ? (
                  <img
                    src={activeTheme == "dark" ? brand?.darkLogo : brand?.logo}
                    style={{ width: "auto", height: 30 }}
                    alt={`logo of ${brand.name}`}
                  />
                ) : (
                  brand?.logo
                )}
                {!brand?.logo && (
                  <Flex align="center" gap={10}>
                    <img src={`${brand?.icon}`} style={{ width: "auto", height: 30 }} alt={`logo of ${brand?.name}`} />
                    <h1 className="font-brand">{brand?.name}</h1>
                  </Flex>
                )}
              </Flex>
            </Link>
            <div
              role="button"
              className={styles.hamburger}
              style={{ position: "absolute", top: 5, right: 10 }}
              aria-label="Toggle menu"
            >
              <Hamburger
                rounded
                direction="left"
                toggled={showSideNav}
                onToggle={(toggle: boolean | ((prevState: boolean) => boolean)) => {
                  setSideNav(toggle);
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileNav;
