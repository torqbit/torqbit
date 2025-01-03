import React from "react";
import { Select, Typography } from "antd";
import { Option } from "./types";

const { Text } = Typography;

interface AnswerKeysProps {
  options: Option[];
  selectedAnswer: string | number[];
  onAnswerChange: (values: string | number[]) => void;
}

export const AnswerKeys: React.FC<AnswerKeysProps> = ({ options, selectedAnswer, onAnswerChange }) => (
  <div>
    <Text strong>Answer Keys</Text>
    <p>Select the list of the answers from above provided options</p>
    <Select
      mode="multiple"
      style={{ width: "100%" }}
      placeholder="Select correct answers"
      value={selectedAnswer}
      onChange={onAnswerChange}
      options={options.map((option) => ({
        label: `Option ${option.key}`,
        value: option.key,
      }))}
    />
  </div>
);
