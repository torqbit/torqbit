export interface Option {
  key: string | number;
  text: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  options: Option[];
  correctOptionIndex: number[];
  explanation?: string;
}
