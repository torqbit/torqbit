import { EmptyCourses } from "@/components/SvgIcons";
import { PageSiteConfig } from "@/services/siteConstant";
import { ICourseListItem } from "@/types/courses/Course";
import { Theme } from "@/types/theme";
import { FC } from "react";
import styles from "./CourseListView.module.scss";
import { Button, Card, Flex, Tag } from "antd";
import { Role } from "@prisma/client";
const { Meta } = Card;
const CourseViewItem: FC<{ course: ICourseListItem }> = ({ course }) => {
  return (
    <Card
      className={styles.course__card}
      cover={<img className={styles.card__img} alt={`thumbnail of ${course.title}`} src={course.trailerThumbnail} />}
    >
      <Meta
        className={styles.meta}
        title={
          <>
            <Tag bordered={true} style={{ fontWeight: "normal" }}>
              {course.difficultyLevel}
            </Tag>
            <h4 style={{ marginTop: 5, marginBottom: 5 }}>{course.title}</h4>
            <p style={{ fontWeight: "normal", marginBottom: 0, fontSize: 14 }}>
              A course by <b>{course.author}</b>
            </p>
          </>
        }
        description={course.description}
      />
      <Flex justify="space-between" align="center" className={styles.card__footer}>
        <div>
          {course.currency} {course.price}
        </div>
        {course.userRole && course.userRole === Role.ADMIN && <Button type="default">Manage</Button>}
        {course.userRole && course.userRole === Role.AUTHOR && <Button type="default">Manage</Button>}
        {course.userRole && course.userRole === Role.NOT_ENROLLED && <Button type="default">Buy Now</Button>}
      </Flex>
    </Card>
  );
};

export const CoursesListView: FC<{
  courses: ICourseListItem[];
  siteConfig: PageSiteConfig;
  currentTheme: Theme;
  handleCourseCreate: () => void;
}> = ({ courses, currentTheme, siteConfig, handleCourseCreate }) => {
  return (
    <div className={styles.courses__list}>
      <h3>Courses</h3>
      <div className={styles.course__grid}>
        {courses.map((c, index) => (
          <CourseViewItem course={c} key={index} />
        ))}
      </div>
    </div>
  );
};
