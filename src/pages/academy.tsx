import type { GetServerSidePropsContext, NextPage } from "next";
import React, { useState } from "react";
import { Role, User } from "@prisma/client";
import { message } from "antd";
import AppLayout from "@/components/Layouts/AppLayout";
import { getSiteConfig } from "@/services/getSiteConfig";
import { PageSiteConfig } from "@/services/siteConstant";
import { getCookieName } from "@/lib/utils";
import { getToken } from "next-auth/jwt";
import MarketingLayout from "@/components/Layouts/MarketingLayout";
import DefaulttHero from "@/components/Marketing/DefaultHero/DefaultHero";
import { EmptyCourses } from "@/components/SvgIcons";
import { useRouter } from "next/router";
import { getIconTheme } from "@/services/darkThemeConfig";
import { useAppContext } from "@/components/ContextApi/AppContext";
import { useSession } from "next-auth/react";
import { useMediaQuery } from "react-responsive";
import learningPath from "@/actions/learningPath";
import { ILearningPathDetail } from "@/types/learingPath";
import LearningPathSerivices from "@/services/learningPath/LearningPathSerivices";
import { AcademyItemsListView } from "@/components/Admin/LearningPath/LearnListView";
import { ICourseListItem } from "@/types/courses/Course";
import ProgramService from "@/services/ProgramService";
import { getCouseListItems } from "@/actions/getCourseListItems";
import styles from "@/components/Admin/LearningPath/LearningPath.module.scss";
const AcademyPage: NextPage<{
  siteConfig: PageSiteConfig;
  userRole: Role;
  pathList: ILearningPathDetail[];
  coursesList: ICourseListItem[];
}> = ({ siteConfig, userRole, pathList, coursesList }) => {
  const [pathListData, setPathListData] = useState<ILearningPathDetail[]>(pathList);
  const [messageApi, contextMessageHolder] = message.useMessage();
  const [loading, setLoading] = useState<boolean>(false);
  const [courses, setCourses] = useState<ICourseListItem[]>(coursesList);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);

  const isMobile = useMediaQuery({ query: "(max-width: 435px)" });

  const router = useRouter();
  const { data: user } = useSession();
  const { globalState } = useAppContext();

  const getPathList = () => {
    setLoading(true);
    LearningPathSerivices.listPath(
      (response) => {
        if (response.success && response.body) {
          setPathListData(response.body);
          setLoading(false);
        } else {
          message.error(response.message);
          setLoading(false);
        }
      },
      (error) => {
        messageApi.error(error);
      }
    );
  };
  const getCourses = () => {
    ProgramService.listCoursesViews((response) => {
      if (response.success && response.body) {
        setCourses(response.body);
        setLoadingCourses(false);
      } else {
        messageApi.error(response.message);
        setLoadingCourses(false);
      }
    });
  };

  const handleItemsList = (key: string) => {
    switch (key) {
      case "courses":
        return getCourses();
      case "learning":
        return getPathList();
      default:
        return getCourses();
    }
  };

  return (
    <section className={styles.academy__page__wraper}>
      {contextMessageHolder}

      {userRole ? (
        <>
          {userRole === Role.STUDENT ? (
            <MarketingLayout
              mobileHeroMinHeight={60}
              showFooter={!isMobile}
              siteConfig={siteConfig}
              heroSection={
                <>
                  {!isMobile && pathListData && (
                    <DefaulttHero
                      title="Academy"
                      description="Offers online  learning  paths and courses designed to enhance your skills and knowledge "
                    />
                  )}
                </>
              }
              user={{ ...user?.user, role: Role.STUDENT } as User}
            >
              <section>
                <div className="page__wrapper">
                  <AcademyItemsListView
                    loadingCourses={loadingCourses}
                    pathList={pathListData || []}
                    courses={courses}
                    handleItemsList={() => {}}
                    loading={loading || !pathListData}
                    siteConfig={siteConfig}
                    currentTheme={globalState.theme || "light"}
                    role={userRole}
                    getPathList={getPathList}
                    emptyView={
                      <EmptyCourses size="300px" {...getIconTheme(globalState.theme || "light", siteConfig.brand)} />
                    }
                  />
                </div>
              </section>
            </MarketingLayout>
          ) : (
            <AppLayout siteConfig={siteConfig}>
              <section>
                <AcademyItemsListView
                  loadingCourses={loadingCourses}
                  courses={courses}
                  handleItemsList={handleItemsList}
                  pathList={pathListData || []}
                  loading={loading || !pathListData}
                  siteConfig={siteConfig}
                  currentTheme={globalState.theme || "light"}
                  role={userRole}
                  getPathList={getPathList}
                  emptyView={
                    <EmptyCourses size="300px" {...getIconTheme(globalState.theme || "light", siteConfig.brand)} />
                  }
                />
              </section>
            </AppLayout>
          )}
        </>
      ) : (
        <>
          <MarketingLayout
            siteConfig={siteConfig}
            heroSection={
              <DefaulttHero
                title="Academy"
                description="Offers online  learning  paths and courses designed to enhance your skills and knowledge "
              />
            }
          >
            {contextMessageHolder}
            <section>
              <div className="page__wrapper">
                <AcademyItemsListView
                  loadingCourses={loadingCourses}
                  courses={courses}
                  handleItemsList={() => {}}
                  pathList={pathListData || []}
                  loading={loading || !pathListData}
                  siteConfig={siteConfig}
                  currentTheme={globalState.theme || "light"}
                  role={userRole}
                  getPathList={getPathList}
                  emptyView={
                    <EmptyCourses size="300px" {...getIconTheme(globalState.theme || "light", siteConfig.brand)} />
                  }
                />
              </div>
            </section>
          </MarketingLayout>
        </>
      )}
    </section>
  );
};

export default AcademyPage;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { req } = ctx;

  let cookieName = getCookieName();

  const user = await getToken({ req, secret: process.env.NEXT_PUBLIC_SECRET, cookieName });
  const pathListResponse = await learningPath.listLearningPath(user?.role, user?.id);
  const courseResponse = await getCouseListItems({ role: user?.role, id: user?.id });

  const siteConfig = getSiteConfig();
  const { site } = siteConfig;
  if (user) {
    return {
      props: {
        siteConfig: site,
        userRole: user?.role,
        pathList: pathListResponse && pathListResponse.success ? pathListResponse.body : [],
        coursesList: courseResponse && courseResponse.success ? courseResponse.body : [],
      },
    };
  } else {
    return {
      props: {
        siteConfig: site,
        pathList: pathListResponse.success ? pathListResponse.body : [],
        coursesList: courseResponse && courseResponse.success ? courseResponse.body : [],
      },
    };
  }
};
