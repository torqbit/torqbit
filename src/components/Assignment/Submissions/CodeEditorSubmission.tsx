import React, { FC } from "react";
import AssignmentCodeEditor from "./AssignmentCodeEditor";
import EvaluatinoList from "./EvaluationList";
import PreviewAssignment from "./PreviewAssignment";
import { SegmentedValue } from "antd/es/segmented";
import { IAllSubmmissionsDetail } from "@/services/AssignmentService";

const CodeEditorSubmission: FC<{
  assignmentId?: number;
  lessonId: number;
  selectedsegment: SegmentedValue;
  previewUrl: string;
  allSubmmissionsDetail: IAllSubmmissionsDetail[];
  evaluationLoading: boolean;
  fileMap: Map<string, string>;
  previewHistory: boolean;
  assignmentFiles: string[];
  saveAssignment: (assignmentId: number, fileMap: Map<string, string>) => void;
  updateAssignmentMap: (fileName: string, newValue: string) => void;
}> = ({
  assignmentId,
  previewUrl,
  fileMap,
  assignmentFiles,
  selectedsegment,
  previewHistory,
  saveAssignment,
  updateAssignmentMap,
  allSubmmissionsDetail,
  evaluationLoading,
}) => {
  return (
    <>
      {selectedsegment === "Code" && assignmentFiles && (
        <AssignmentCodeEditor
          fileMap={fileMap}
          saveAssignment={saveAssignment}
          assignmentFiles={assignmentFiles}
          assignmentId={assignmentId}
          updateAssignmentMap={updateAssignmentMap}
          readOnly={previewHistory}
        />
      )}
      {selectedsegment === "Preview" && <PreviewAssignment previewUrl={previewUrl} />}

      {selectedsegment === "Evaluations" && (
        <EvaluatinoList loading={evaluationLoading} allSubmission={allSubmmissionsDetail} />
      )}
    </>
  );
};

export default CodeEditorSubmission;
