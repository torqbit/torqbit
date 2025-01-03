import React from "react";
import { Input, Space, Typography } from "antd";
import TextEditor from "@/components/Editor/Quilljs/Editor";

const { Text } = Typography;
const { TextArea } = Input;

interface QuestionTitleProps {
  title: string;
  description?: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

const QuestionTitle: React.FC<QuestionTitleProps> = ({ title, description, onTitleChange, onDescriptionChange }) => (
  <Space style={{ marginBottom: 16, width: "100%" }} direction="vertical" size="middle">
    <Space direction="vertical" style={{ width: "100%" }} size="small">
      <Text strong>Question</Text>
      <p style={{ marginBottom: 0 }}>Provide a brief title to the question</p>
      <Input
        required
        placeholder="Provide a brief title to the question"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
    </Space>
    <Space direction="vertical" style={{ width: "100%" }} size="small">
      <Text type="secondary">Description (Optional)</Text>
      <TextEditor
        defaultValue={description as string}
        handleDefaultValue={onDescriptionChange}
        readOnly={false}
        height={150}
        theme="snow"
        placeholder={`Start writing your`}
      />
    </Space>
  </Space>
);

export default QuestionTitle;
