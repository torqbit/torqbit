import React, { useState } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import QuestionCard from "./QuestionCard";
import { createEmptyQuestion } from "../AddAssignment";
import { MultipleChoiceQA } from "@/types/courses/assignment";

const MCQForm: React.FC<{
  questions: MultipleChoiceQA[];
  setQuestions: React.Dispatch<React.SetStateAction<MultipleChoiceQA[]>>;
}> = ({ questions, setQuestions }) => {
  const handleQuestionChange = (updatedQuestion: MultipleChoiceQA) => {
    setQuestions((prev) => prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)));
  };

  const handleAddQuestion = () => {
    const newId = String(questions.length + 1);
    setQuestions((prev) => [...prev, createEmptyQuestion(newId)]);
  };
  const handleDeleteQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  return (
    <div style={{ padding: 5 }}>
      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          onQuestionChange={handleQuestionChange}
          onDeleteQuestion={handleDeleteQuestion}
        />
      ))}
      <Button type="dashed" onClick={handleAddQuestion} icon={<PlusOutlined />} block style={{ marginTop: 16 }}>
        Add Question
      </Button>
    </div>
  );
};

export default MCQForm;
