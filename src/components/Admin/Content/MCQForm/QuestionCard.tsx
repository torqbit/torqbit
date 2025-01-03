import React from "react";
import { Alert, Card, Popconfirm } from "antd";
import QuestionTitle from "./QuestionTitle";
import OptionsSection from "./OptionSection";
import { AnswerKeys } from "./AnswerKeys";
import QuestionExplanation from "./QuestionExplanation";
import { DeleteFilled } from "@ant-design/icons";
import ConfigFormLayout from "@/components/Configuration/ConfigFormLayout";
import { MultipleChoiceQA } from "@/types/courses/assignment";

interface QuestionCardProps {
  question: MultipleChoiceQA;
  onQuestionChange: (updatedQuestion: MultipleChoiceQA) => void;
  onDeleteQuestion: (questionId: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onQuestionChange, onDeleteQuestion }) => {
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[index] = { ...newOptions[index], text: value };
    onQuestionChange({ ...question, options: newOptions });
  };

  const handleAddOption = () => {
    const newKey = String.fromCharCode(65 + question.options.length);
    onQuestionChange({
      ...question,
      options: [...question.options, { key: newKey, text: "" }],
    });
  };

  const onDeleteOption = (index: number) => {
    const newOptions = [...question.options];
    newOptions.splice(index, 1);
    onQuestionChange({ ...question, options: newOptions });
  };

  return (
    <ConfigFormLayout
      formTitle={`Question ${question.id}`}
      width="100%"
      isCollapsible
      marginBottom="10px"
      extraContent={
        <Popconfirm
          title="Delete the question"
          description="Are you sure to delete this question?"
          onConfirm={() => onDeleteQuestion(question.id)}
          onCancel={() => {}}
          okText="Yes"
          cancelText="No"
        >
          <DeleteFilled />
        </Popconfirm>
      }
    >
      <QuestionTitle
        title={question.title}
        description={question.description}
        onTitleChange={(value: string) => onQuestionChange({ ...question, title: value })}
        onDescriptionChange={(value: string) => onQuestionChange({ ...question, description: value })}
      />
      <OptionsSection
        options={question.options}
        onOptionChange={handleOptionChange}
        onAddOption={handleAddOption}
        deleteOption={onDeleteOption}
      />
      <AnswerKeys
        options={question.options}
        selectedAnswer={question.correctOptionIndex}
        onAnswerChange={(values: any) => onQuestionChange({ ...question, correctOptionIndex: values })}
      />
      <QuestionExplanation
        explanation={question.answerExplaination || ""}
        onChange={(value: string) => onQuestionChange({ ...question, answerExplaination: value })}
      />
    </ConfigFormLayout>
  );
};

export default QuestionCard;
