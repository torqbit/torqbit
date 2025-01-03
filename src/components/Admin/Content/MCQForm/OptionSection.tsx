import React from "react";
import { Input, Button, Space, Typography } from "antd";
import { DeleteFilled, PlusOutlined } from "@ant-design/icons";
import { Option } from "./types";

const { Text } = Typography;

interface OptionsSectionProps {
  options: Option[];
  onOptionChange: (index: number, value: string) => void;
  onAddOption: () => void;
  deleteOption: (index: number) => void;
}

const OptionsSection: React.FC<OptionsSectionProps> = ({ options, onOptionChange, onAddOption, deleteOption }) => (
  <div className="options-section" style={{ marginTop: 40 }}>
    <Text strong>Options</Text>
    <p>Provide a list of options that will be provided to the learners for answering the question</p>
    <Space direction="vertical" style={{ width: "100%", marginBottom: 10 }}>
      {options.map((option, index) => (
        <Input
          key={option.key}
          placeholder={`Option ${option.key}`}
          value={option.text}
          onChange={(e) => onOptionChange(index, e.target.value)}
          addonBefore={option.key}
          addonAfter={<DeleteFilled onClick={() => deleteOption(index)} />}
        />
      ))}
      <Button type="dashed" onClick={onAddOption} icon={<PlusOutlined />} className="add-option-button" block>
        Add Option
      </Button>
    </Space>
  </div>
);

export default OptionsSection;
