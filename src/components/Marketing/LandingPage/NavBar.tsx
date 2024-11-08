import { FC } from "react";
import styles from "@/styles/Marketing/LandingPage/LandingPage.module.scss";
import Image from "next/image";
import { Button, Dropdown, Flex, MenuProps, Tooltip } from "antd";
import appConstant from "@/services/appConstant";
import Link from "next/link";
import SvgIcons from "@/components/SvgIcons";
import { useAppContext } from "@/components/ContextApi/AppContext";
import { User } from "@prisma/client";

const NavBar: FC<{ user: User | undefined; offlineCourse: boolean | undefined }> = ({ user, offlineCourse }) => {
  const { dispatch, globalState } = useAppContext();

  const navLinks = [
    {
      title: "Courses",
      href: "/#courses",
    },
    {
      title: "Events",
      href: "/events",
    },
    {
      title: "Blogs",
      href: "/blogs",
    },
  ];
  const onChangeTheme = () => {
    const currentTheme = localStorage.getItem("theme");

    if (currentTheme === "dark") {
      localStorage.setItem("theme", "light");
      dispatch({
        type: "SWITCH_THEME",
        payload: "light",
      });
    } else if (currentTheme === "light") {
      localStorage.setItem("theme", "dark");
      dispatch({
        type: "SWITCH_THEME",
        payload: "dark",
      });
    }
  };

  return (
    <div className={styles.navBarContainer}>
      <nav>
        <Link href={"/"} aria-label="Go back to landing page">
          <Flex align="center" gap={5}>
            <Image src={"/icon/torqbit.png"} height={40} width={40} alt={"logo"} />
            <h1 className="font-brand">{appConstant.platformName.toUpperCase()}</h1>
          </Flex>
        </Link>
        <ul>
          {navLinks.map((link, i) => {
            return (
              <li key={i}>
                {link.title === "Courses" ? (
                  <a href={link.href}>{link.title}</a>
                ) : (
                  <Link href={link.href} aria-label={`link to ${link.title} page`}>
                    {link.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <Flex align="center" gap={20}>
          <Tooltip title={"Switch Theme"}>
            <Button
              type="default"
              name="theme button"
              aria-label="Theme Switch"
              className={styles.switchBtn}
              shape="circle"
              onClick={() => {
                onChangeTheme();
              }}
              icon={globalState.theme == "dark" ? SvgIcons.sun : SvgIcons.moon}
            />
          </Tooltip>
          {offlineCourse ? (
            <Link href={"tel:7463811090"} aria-label="Get started">
              <Button type="primary" className={styles.contact_button}>
                <Flex align="center" gap={5}>
                  <i className={styles.button_icon}>{SvgIcons.phone}</i>
                  +91-7463811090
                </Flex>
              </Button>
            </Link>
          ) : (
            <Link href={user ? `/dashboard` : `/login`} aria-label="Get started">
              <Button type="primary">{user ? "Go to Dashboard" : "Get Started"}</Button>
            </Link>
          )}
        </Flex>
      </nav>
    </div>
  );
};

export default NavBar;
