import type { Question } from "./types";

const questionTypeOrder: Record<Question["type"], number> = {
  checkbox: 0,
  number: 1,
  rating: 1,
  select: 2,
  text_short: 3,
  text_long: 4
};

export const sortQuestionsByType = (questions: Question[]) =>
  [...questions].sort((a, b) => {
    const groupA = questionTypeOrder[a.type] ?? 99;
    const groupB = questionTypeOrder[b.type] ?? 99;
    if (groupA !== groupB) return groupA - groupB;
    return a.sort_order - b.sort_order;
  });

export const groupQuestionsByType = (questions: Question[]) => {
  const groups = {
    checkbox: [] as Question[],
    numberRating: [] as Question[],
    select: [] as Question[],
    text: [] as Question[]
  };

  questions.forEach((question) => {
    if (question.type === "checkbox") {
      groups.checkbox.push(question);
    } else if (question.type === "number" || question.type === "rating") {
      groups.numberRating.push(question);
    } else if (question.type === "select") {
      groups.select.push(question);
    } else {
      groups.text.push(question);
    }
  });

  groups.checkbox = sortQuestionsByType(groups.checkbox);
  groups.numberRating = sortQuestionsByType(groups.numberRating);
  groups.select = sortQuestionsByType(groups.select);
  groups.text = sortQuestionsByType(groups.text);

  return groups;
};
