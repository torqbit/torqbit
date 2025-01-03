import React from "react";
import { Input, Space, Typography } from "antd";

const { Text } = Typography;
const { TextArea } = Input;

interface QuestionExplanationProps {
  explanation: string;
  onChange: (value: string) => void;
}

const QuestionExplanation: React.FC<QuestionExplanationProps> = ({ explanation, onChange }) => (
  <Space direction="vertical" style={{ width: "100%", marginTop: 10 }} size="small">
    <Text type="secondary">Answer explanation (Optional)</Text>
    <TextArea
      placeholder="Provide a brief explanation to the answer."
      value={explanation}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
    />
  </Space>
);

export default QuestionExplanation;
