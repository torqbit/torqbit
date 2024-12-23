import { convertToDayMonthTime } from "@/lib/utils";
import appConstant from "@/services/appConstant";
import { IAllSubmmissionsDetail } from "@/services/course/AssignmentService";
import { Flex, Table } from "antd";
import { FC, useState } from "react";
import styles from "@/styles/AssignmentEvaluation.module.scss";
import ViewResult from "./ViewResult";
import SpinLoader from "../../SpinLoader/SpinLoader";

const EvaluatinoList: FC<{ loading: boolean; allSubmission: IAllSubmmissionsDetail[] }> = ({
  allSubmission,
  loading,
}) => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<IAllSubmmissionsDetail>();

  const data =
    allSubmission.length > 0
      ? allSubmission
        .sort((a, b) => b.submissionId - a.submissionId)
        .map((s, i) => {
          return {
            key: i,
            DateSubmitted: convertToDayMonthTime(new Date(s.submittedDate)),
            score: s.score
              ? `${s.score} / ${appConstant.assignmentMaxScore}`
              : `- / ${appConstant.assignmentMaxScore}`,
            pass: s.score ? (s.score >= appConstant.assignmentPassingMarks ? "YES" : "NO") : "NA",
            isEvaluated: s.evaluated,
            submissionId: s.submissionId,
          };
        })
      : [];
  const columns: any = [
    {
      title: "DATE SUBMITTED",
      dataIndex: "DateSubmitted",
      key: "DateSubmitted",
    },
    {
      title: "SCORE",
      dataIndex: "score",
      key: "score",
      align: "center",
    },
    {
      title: "PASSED",
      dataIndex: "pass",

      key: "pass",
      align: "center",
    },
    ,
    {
      title: "",
      align: "center",

      dataIndex: "actions",
      render: (_: any, submissionInfo: any) => (
        <>
          {" "}
          {submissionInfo.isEvaluated ? (
            <span
              className={styles.viewButton}
              onClick={() => {
                setSelectedSubmission(allSubmission.find((f) => f.submissionId === submissionInfo.submissionId));
                setDrawerOpen(true);
              }}
            >
              View Details
            </span>
          ) : (
            "Evaluation Pending"
          )}
        </>
      ),
      key: "key",
    },
  ];
  return (
    <>
      {loading ? (
        <>
          <Flex align="center" justify="center">
            <SpinLoader className="editor_spinner" />
          </Flex>
        </>
      ) : (
        <>
          {allSubmission.length === 0 ? (
            <Flex vertical className={styles.no_submission_container} align="center" justify="center">
              <h1>No Submissions</h1>
              <p>You haven&apos;t submitted the assignment yet</p>
            </Flex>
          ) : (
            <>
              <Table
                pagination={false}
                className={styles.evaluation_result_table}
                size="small"
                columns={columns}
                dataSource={data}
                loading={loading}
              />

              <ViewResult
                score={Number(selectedSubmission?.score)}
                comment={String(selectedSubmission?.comment)}
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
              />
            </>
          )}
        </>
      )}
    </>
  );
};

export default EvaluatinoList;
