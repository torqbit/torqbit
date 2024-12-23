import { Button, Dropdown, message, Table } from "antd";
import { useEffect, useState } from "react";
import SvgIcons from "../../SvgIcons";
import AssignmentService, {
  ISubmissionTableInfo,
  ISubmissionList,
  SubmissionsByCourseId,
} from "@/services/course/AssignmentService";
import Link from "next/link";

const SubmissionList = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<ISubmissionTableInfo[]>([]);

  const filterUniqueItems = () => {
    if (data.length > 0) {
      const courseNames = data.map((d) => d.courseName);
      const assignmentNames = data.map((d) => d.assignmentName);
      const uniqueAssignmentSet = new Set(assignmentNames);
      const uniqueSet = new Set(courseNames);

      return Array.from(uniqueSet).map((item) => {
        const children = Array.from(uniqueAssignmentSet).map((assign) => {
          if (data.find((f) => f.assignmentName === assign)?.courseName === item) {
            if (assign) {
              return {
                text: assign,
                value: assign,
              };
            }
          }
        });

        return {
          text: item,
          value: item,
          children: children.filter((f) => f),
        };
      });
    }
  };

  function flattenMapValues(map: SubmissionsByCourseId): ISubmissionTableInfo[] {
    const flattenedArray: ISubmissionList[] = [];

    for (const courseName in map) {
      if (Object.prototype.hasOwnProperty.call(map, courseName)) {
        const submissions = map[courseName].map((d) => {
          return { ...d, courseName: String(courseName.split("--").pop()) };
        });

        flattenedArray.push(...submissions);
      }
    }

    return flattenedArray.map((d) => {
      return {
        key: d.subId,
        courseName: d.courseName,
        assignmentName: d.assignmentName,
        student: d.studentName,
        submissionDate: d.submissionDate,
        isEvaluated: d.isEvaluated,
        assignmentId: d.assignmentId,
      };
    });
  }

  const columns: any = [
    {
      title: "COURSE NAME",
      dataIndex: "courseName",
      key: "courseName",
      filters: filterUniqueItems(),
      filterMode: "tree",
      filterSearch: true,
      onFilter: (value: string, record: ISubmissionTableInfo) => {
        return record.courseName.startsWith(value as string) || record.assignmentName.startsWith(value as string);
      },
    },
    {
      title: "ASSIGNMENT NAME",
      dataIndex: "assignmentName",
      key: "assignmentName",
    },
    {
      title: "STUDENT",
      dataIndex: "student",

      key: "student",
    },
    {
      title: "SUBMISSION DATE",
      dataIndex: "submissionDate",
      key: "submissionDate",
    },
    {
      title: "ACTIONS",
      dataIndex: "actions",
      render: (_: any, submissionInfo: any) => (
        <Link href={`/admin/content/submission/${submissionInfo.key}/evaluate`}>
          <Button type="primary">{submissionInfo.isEvaluated ? "View Result" : "Evaluate"}</Button>
        </Link>
      ),
      key: "key",
    },
  ];

  const getSubmissionList = () => {
    setLoading(true);
    try {
      AssignmentService.listSubmission(
        (result) => {
          setData(flattenMapValues(result.submissionList));
          setLoading(false);
        },
        (error) => {
          messageApi.error({
            content: error,
          });
          setLoading(false);
        }
      );
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSubmissionList();
  }, []);

  return (
    <div>
      {contextHolder}
      <Table size="small" columns={columns} dataSource={data} loading={loading} />
    </div>
  );
};

export default SubmissionList;
