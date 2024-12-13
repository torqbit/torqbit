import TextEditor from "@/components/Editor/Quilljs/Editor";
import React, { FC, useState } from "react";

const TextEditorSubmission: FC<{
  textEditorValue: string;
  setDefaultValue: (value: string) => void;
}> = ({ textEditorValue: editorValue, setDefaultValue }) => {
  return (
    <section className="text-editor-submission">
      <TextEditor
        defaultValue={editorValue as string}
        handleDefaultValue={setDefaultValue}
        readOnly={false}
        height={300}
        theme="snow"
        placeholder={`Start writing your`}
      />
    </section>
  );
};

export default TextEditorSubmission;
