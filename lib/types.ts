export type Section = {
  id: string;
  key: string;
  title: string;
  sort_order: number;
};

export type Question = {
  id: string;
  person_id: string;
  section_id: string;
  prompt: string;
  type: "checkbox" | "number" | "rating" | "select" | "text_short" | "text_long";
  options: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
};

export type Answer = {
  question_id: string;
  value_bool?: boolean | null;
  value_num?: number | null;
  value_text?: string | null;
  value_json?: Record<string, unknown> | null;
};

export type Task = {
  id: string;
  title: string;
  due_date: string;
  status: "todo" | "done";
};
