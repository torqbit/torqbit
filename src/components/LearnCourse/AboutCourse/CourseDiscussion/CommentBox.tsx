import React, { FC, useState } from "react";
import styles from "@/styles/LearnLecture.module.scss";
import { Avatar, Button, Input, Popconfirm, Space, message } from "antd";
import { UserOutlined, DeleteOutlined, EditOutlined, CloseOutlined } from "@ant-design/icons";
import Image from "next/image";
import { IResponse, getFetch, postFetch } from "@/services/request";
import { useSession } from "next-auth/react";
import moment from "moment";
import { IComments } from "./CourseDiscussion";
import ImagePreview from "@/components/ImagePreview/ImagePreview";
import { customFromNow } from "@/services/momentConfig";
moment.locale("en", { ...customFromNow });

export interface IAttachedFiles {
  url: string;
  fileId: string;
  caption?: string;
}

const CommentBox: FC<{
  resourceId: number;
  parentCommentId?: number;
  comment: IComments;
  replyList: boolean;
  replyRefresh?: boolean;
  onRefresh: () => void;
  showReplyDrawer: (cmt: IComments) => void;
}> = ({ comment, onRefresh, replyList, resourceId, parentCommentId, showReplyDrawer, replyRefresh }) => {
  const { data: session } = useSession();
  const [isEdited, setEdited] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isReply, setReply] = useState<{ open: boolean; id: number }>({ open: false, id: 0 });
  const [refresh, setRefresh] = useState<boolean>(false);
  const [allReplyCmtCount, setAllReplyCmtCount] = useState<number>(0);
  const [editComment, setEditComment] = useState<string>("");
  const attachedFiles = comment.attachedFiles as any;

  const getTotalReplyCmt = async (id: number) => {
    const res = await getFetch(`/api/qa-discussion/get-list/reply/count/${id}`);
    const result = (await res.json()) as IResponse;
    if (res.ok && result.success) {
      setAllReplyCmtCount(result.allReplyCmts);
    } else {
      message.error(result.error);
    }
  };

  React.useEffect(() => {
    if (replyList) {
      getTotalReplyCmt(comment.id);
    }
  }, [comment.id, refresh, replyRefresh]);

  const onDeleteComment = async (cmtId: number) => {
    const deleteRes = await getFetch(`/api/qa-discussion/delete/${cmtId}`);
    const result = (await deleteRes.json()) as IResponse;
    if (deleteRes.ok && result.success) {
      message.success(result.message);
      onRefresh();
      setRefresh(!refresh);
    } else {
      message.error(result.error);
    }
  };

  const onEditComment = async () => {
    if (!editComment || comment.comment.trim() == editComment.trim()) {
      setEdited(false);
      return;
    }
    setLoading(true);
    const editRes = await postFetch({ comment: editComment }, `/api/qa-discussion/update/${comment.id}`);
    const result = (await editRes.json()) as IResponse;
    if (editRes.ok && result.success) {
      onRefresh();
      message.success(result.message);
      setEditComment(result.comment.comment);
      setEdited(false);
    } else {
      message.error(result.error);
    }
    setLoading(false);
  };

  return (
    <>
      <div className={styles.comment_box} key={comment.id} id={`comment_${comment.id}`}>
        <Avatar size={40} src={comment.user.image} icon={<UserOutlined />} className={styles.user_icon} alt="Profile" />
        <div className={styles.comment}>
          <div className={`${styles.comment_body} comment-card-body`}>
            <div className={styles.comment_body_header}>
              <Space className={styles.user_info}>
                <h4>{comment.user.name}</h4>
                <p className="dot">•</p>
                <h5 className={styles.comment_time}>
                  {moment(new Date(comment.createdAt), "YYYY-MM-DDThh:mm:ss").fromNow()}
                </h5>
              </Space>
              {session?.id === comment.user.id && (
                <Space className={styles.comment_action_btns}>
                  {isEdited ? (
                    <CloseOutlined onClick={() => setEdited(false)} />
                  ) : (
                    <EditOutlined
                      onClick={() => {
                        setEdited(true);
                        setEditComment(comment.comment);
                      }}
                    />
                  )}

                  <Popconfirm
                    title="Delete the post"
                    description="Are you sure to delete this post?"
                    onConfirm={() => onDeleteComment(comment.id)}
                    okText="Yes"
                    cancelText="Continue"
                  >
                    <DeleteOutlined />
                  </Popconfirm>
                </Space>
              )}
            </div>
            <div className={styles.comment_content}>
              {isEdited ? (
                <Input.TextArea
                  placeholder="Edit Post"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.shiftKey) {
                      onEditComment();
                    }
                  }}
                  className={styles.qa_edit_input}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                />
              ) : (
                <>{comment.comment}</>
              )}
            </div>
          </div>
          <div className={styles.comment_footer}>
            <div className={styles.reply_btn}>
              {isEdited ? (
                <Space>
                  <Button type="primary" loading={loading} size="small" onClick={onEditComment}>
                    Save
                  </Button>
                  <Button size="small" onClick={() => setEdited(false)}>
                    Cancel
                  </Button>
                </Space>
              ) : (
                <Space align="center">
                  {replyList && (
                    <span onClick={() => showReplyDrawer(comment)}>
                      <Image src="/img/comment-icons/directleft.svg" alt="Reply" width={25} height={25} />{" "}
                      {isReply.open ? (
                        "Cancel"
                      ) : (
                        <span>Reply {allReplyCmtCount > 0 && replyList && allReplyCmtCount}</span>
                      )}
                    </span>
                  )}

                  {attachedFiles?.length > 0 && (
                    <ImagePreview imgs={attachedFiles?.map((img: IAttachedFiles) => img.url)} />
                  )}
                </Space>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentBox;