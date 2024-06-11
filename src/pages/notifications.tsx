import React, { FC, useState } from "react";
import styles from "@/styles/Dashboard.module.scss";
import { useSession } from "next-auth/react";
import { Avatar, Badge, Button, Flex, List, Skeleton } from "antd";
import Layout2 from "@/components/Layouts/Layout2";
import Link from "next/link";
import { truncateString } from "@/services/helper";
import moment from "moment";
import NotificationService from "@/services/NotificationService";
import { INotification } from "@/lib/types/discussions";
import { DummydataList } from "@/lib/dummyData";
import { useRouter } from "next/router";
import { getFetch } from "@/services/request";

const NotificationList: FC = () => {
  const router = useRouter();
  const { data: user } = useSession();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDatatLoading] = useState<boolean>();
  const [allNotificationRender, setAllNotificationRender] = useState<boolean>();
  const [notificationsCount, setNotificationsCount] = useState<number>();
  const [notifications, setNotifications] = useState<INotification[]>();
  const [notificationsList, setNotificationsList] = useState<INotification[]>();

  const getNotification = async () => {
    try {
      setLoading(true);

      NotificationService.getNotifications(
        0,
        10,
        (result) => {
          setNotifications(result.notifications);
          setNotificationsList(result.notifications);
          setNotificationsCount(result.notificationsCount);
          setLoading(false);
        },
        (error) => {
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.log(err);

      setLoading(false);
    }
  };

  const updateNotification = async (item: INotification) => {
    try {
      let apiPath = item.tagCommentId
        ? `/api/v1/notification/updateMany/update?tagCommentId=${item.tagCommentId}`
        : `/api/v1/notification/update/${item.id}`;
      getFetch(apiPath);
      let courseId = item.tagCommentId ? item.tagComment?.resource?.chapter?.courseId : item.resource.chapter.courseId;
      let resourceId = item.comment.resourceId;
      item.tagCommentId
        ? router.push(`/courses/${courseId}/lesson/${resourceId}?tab=QA&threadId=${item?.tagCommentId}`)
        : router.push(`/courses/${courseId}/lesson/${resourceId}?tab=QA&queryId=${item?.id}`);
    } catch (err) {}
  };

  const onLoadMore = () => {
    DummydataList && setNotificationsList(notificationsList?.concat(DummydataList) as INotification[]);

    NotificationService.getNotifications(
      notificationsList?.length,
      5,
      (result) => {
        notificationsList?.filter((n) => n.loading === true);
        notifications && setNotificationsList(notificationsList?.concat(result.notifications));
      },
      (err) => {
        notificationsList?.filter((n) => n.loading === true);
        notifications && setNotificationsList(notificationsList);

        setAllNotificationRender(true);
      }
    );

    setDatatLoading(false);
  };

  React.useEffect(() => {
    if (user?.id) {
      getNotification();
    }
  }, [user?.id]);

  const loadMore =
    !dataLoading &&
    !loading &&
    notificationsList &&
    notificationsCount &&
    notificationsCount > 10 &&
    notificationsCount > notificationsList?.length ? (
      <>
        {!allNotificationRender && (
          <Flex style={{ marginTop: 20 }} align="center" justify="center">
            <Button
              type="primary"
              onClick={() => {
                onLoadMore();
              }}
            >
              Load More
            </Button>
          </Flex>
        )}
      </>
    ) : null;

  return (
    <List
      size="small"
      loading={loading}
      header={false}
      footer={false}
      loadMore={loadMore}
      bordered={false}
      dataSource={notificationsList}
      className={styles.notifications_list}
      renderItem={(item, index) => (
        <List.Item
          onClick={() => {
            updateNotification(item);
          }}
          className={styles.notification_bar}
        >
          {" "}
          <Skeleton avatar title={false} loading={item.loading} active>
            <Flex align="center" justify="space-between">
              <List.Item.Meta
                avatar={
                  <Badge color="blue" dot={!item.isView}>
                    <Avatar src={item.fromUser.image} />
                  </Badge>
                }
                title={
                  <Link href="#">
                    <span className={styles.title}> {item.fromUser.name}</span>
                    {item.notificationType === "COMMENT" ? (
                      <span className={styles.reply_text}>
                        replied on Question {" : "}
                        <span>{truncateString(item?.tagComment?.comment as string, 20)}</span>
                      </span>
                    ) : (
                      ""
                    )}
                  </Link>
                }
                description={<span className={styles.description_text}>{item.comment.comment} </span>}
              />
              <span>{moment(new Date(item.createdAt), "YYYY-MM-DDThh:mm:ss").fromNow()}</span>
            </Flex>
          </Skeleton>
        </List.Item>
      )}
    />
  );
};

const Dashboard: FC = () => {
  const { data: user } = useSession();

  return (
    <Layout2>
      <section className={styles.dashboard_content}>
        <h2>Hello {user?.user?.name}</h2>
        <h3>Notification</h3>

        <NotificationList />
      </section>
    </Layout2>
  );
};

export default Dashboard;
