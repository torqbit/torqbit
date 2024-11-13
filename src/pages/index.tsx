import React, { FC } from "react";
import { useAppContext } from "@/components/ContextApi/AppContext";
import { CourseCategory, ICourseCategory } from "@/components/CourseCategory/CourseCategory";
import About from "@/components/Marketing/LandingPage/About";
import Hero from "@/components/Marketing/LandingPage/Hero";
import { Theme, User } from "@prisma/client";

import { useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import MarketingLayout from "@/components/Layouts/MarketingLayout";
import { GetServerSidePropsContext, NextPage } from "next";
import { getCookieName } from "@/lib/utils";
import { getToken } from "next-auth/jwt";
import AOS from "aos";
import GetStarted from "@/components/Marketing/LandingPage/GetStarted";
import Image from "next/image";
import HeroImage from "@/components/Marketing/LandingPage/HeroImage";
import appConstant from "@/services/appConstant";
interface IProps {
  user: User;
}

const LandingPage: FC<IProps> = ({ user }) => {
  const { dispatch } = useAppContext();
  const isMobile = useMediaQuery({ query: "(max-width: 435px)" });
  const courseCategoryFrontend: ICourseCategory = {
    name: "Frontend Development",
    image: "https://torqbit-dev.b-cdn.net/website/img/front-end-development.png",
    description:
      "Learn to build a portfolio website using web technologies, that captivates users interest and drives more attention from all around the world",
    courses: [
      {
        name: "Build Static Websites",
        tools: ["HTML", "CSS", "Responsive"],
        link: "/course/build-static-websites",
      },
      {
        name: "Version Control with Git & Github",
        tools: ["VCS", "Git", "Rebase"],
        link: "/course/version-control-with-git-and-github",
      },
      {
        name: "Program with Javascript & Typescript",
        tools: ["DOM", "ES6+", "OOP"],
        link: "/course/program-with-javascript-and-typescript",
      },
      {
        name: "Develop UI Components with ReactJS",
        link: "/course/develop-ui-components-with-reactjs",
        tools: ["Hooks", "State", "Context"],
      },
    ],
  };

  const courseCategoryBackend: ICourseCategory = {
    name: "Backend Development",
    image: "https://torqbit-dev.b-cdn.net/website/img/backend-development.png",
    description:
      "Transform the personal website into a full blown portfolio website builder by integrating with database, adding social authentication, providing customisations and much more",
    courses: [
      {
        name: "Build CLI Apps with Node.JS",
        tools: ["HTTP", "Async", "File System"],
        link: "builc-cli-apps-with-nodejs",
      },
      {
        name: "Build APIs with Next.JS",
        link: "/course/build-apis-with-nextjs",
        tools: ["Routes", "Cache", "SSR"],
      },
      {
        name: "Store Data in RDBMS",
        tools: ["Postgres", "MySQL", "ORM"],
        link: "/course/store-data-in-rdbms",
      },
      {
        name: "Secure APIs with NextAuth.JS",
        tools: ["OAuth", "JWT", "Security"],
        link: "/course/secure-apis-with-nextauth",
      },
    ],
  };

  const courseCategoryDevops: ICourseCategory = {
    name: "DevOps & Infrastructure",
    image: "https://torqbit-dev.b-cdn.net/website/img/devops.png",
    description:
      "Move the developed platform into a cloud, to transform into software as a Service using conatainers and leverage AWS cloud infrastructure to host the database, EKS, S3, Route53 and many more to run the service in production",
    courses: [
      {
        name: "Package and Deploy Containter Apps",
        link: "/course/package-and-deploy-container-apps",
        tools: ["Docker", "Helm", "Kubernetes"],
      },
      {
        name: "Host Services in Cloud with AWS",
        tools: ["S3", "Route53", "ALB", "EC2"],
        link: "/course/host-services-in-cloud-with-aws",
      },
    ],
  };

  const setGlobalTheme = (theme: Theme) => {
    dispatch({
      type: "SWITCH_THEME",
      payload: theme,
    });
  };

  const onCheckTheme = () => {
    const currentTheme = localStorage.getItem("theme");
    if (!currentTheme || currentTheme === "dark") {
      localStorage.setItem("theme", "dark");
    } else if (currentTheme === "light") {
      localStorage.setItem("theme", "light");
    }
    setGlobalTheme(localStorage.getItem("theme") as Theme);

    dispatch({
      type: "SET_LOADER",
      payload: false,
    });
  };

  useEffect(() => {
    AOS.init();
    onCheckTheme();
  }, []);

  return (
    <MarketingLayout
      courseTitle={`Learn to build software products | ${appConstant.platformName}`}
      user={user}
      heroSection={<Hero isMobile={isMobile} user={user} />}
    >
      {/* <HeroImage isMobile={isMobile} /> */}
    </MarketingLayout>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { req } = ctx;

  let cookieName = getCookieName();

  const user = await getToken({ req, secret: process.env.NEXT_PUBLIC_SECRET, cookieName });

  return { props: { user } };
};
export default LandingPage;
