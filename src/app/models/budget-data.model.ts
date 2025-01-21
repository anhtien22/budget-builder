import { Category } from "./category.model";
import { MonthData } from "./month-data.model";

export interface BudgetData {
  categories: Category[];
  months: MonthData[];
}
