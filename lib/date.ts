import { addDays, format, parseISO } from "date-fns";

export const formatDate = (date: Date) => format(date, "yyyy-MM-dd");

export const parseDate = (value: string) => parseISO(value);

export const todayString = () => formatDate(new Date());

export const tomorrowString = (value: string) =>
  formatDate(addDays(parseDate(value), 1));
