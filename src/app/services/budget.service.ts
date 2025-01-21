import { Injectable, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BudgetData } from '../models/budget-data.model';
import { MonthData } from '../models/month-data.model';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private readonly _budgetData: WritableSignal<BudgetData> = signal({
    categories: [
      {
        id: 1,
        name: 'Income',
        subCategories: [
          { id: 1, name: 'Sales', values: {} },
          { id: 2, name: 'Commission', values: {} },
        ],
      },
      {
        id: 2,
        name: 'Other Income',
        subCategories: [
          { id: 3, name: 'Training', values: {} },
          { id: 4, name: 'Consulting', values: {} },
        ],
      },
      {
        id: 3,
        name: 'Expenses',
        subCategories: [
          { id: 5, name: 'Management Fees', values: {} },
          { id: 6, name: 'Cloud Hosting', values: {} },
        ],
      },
      {
        id: 4,
        name: 'Salaries & Wages',
        subCategories: [
          { id: 7, name: 'Full Time Dev Salaries', values: {} },
          { id: 8, name: 'Part Time Dev Salaries', values: {} },
          { id: 9, name: 'Remote Salaries', values: {} },
        ],
      },
    ],
    months: this.generateDefaultMonths(),
  });

  private readonly _budgetData$ = new BehaviorSubject<BudgetData>(
    this._budgetData()
  );
  public budgetData = this._budgetData$.asObservable();

  private readonly _startMonth: WritableSignal<Date> = signal(
    new Date(2024, 0, 1)
  );
  public startMonth = this._startMonth.asReadonly();
  private readonly _endMonth: WritableSignal<Date> = signal(
    new Date(2024, 11, 1)
  );
  public endMonth = this._endMonth.asReadonly();

  public updateStartMonth(date: Date) {
    this._startMonth.set(date);
    this.updateMonths();
  }

  public updateEndMonth(date: Date) {
    this._endMonth.set(date);
    this.updateMonths();
  }
  private updateMonths() {
    const months = this.generateMonths(this._startMonth(), this._endMonth());
    this._budgetData.update((budgetData) => ({
      ...budgetData,
      months: months,
    }));
    this._budgetData$.next(this._budgetData());
  }
  private generateDefaultMonths(): MonthData[] {
    return this.generateMonths(new Date(2024, 0, 1), new Date(2024, 11, 1));
  }

  private generateMonths(startDate: Date, endDate: Date): MonthData[] {
    const months: MonthData[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      months.push({
        yearMonth: currentDate.toISOString().slice(0, 7),
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        monthName: currentDate.toLocaleString('default', { month: 'long' }),
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  }
  public updateCategoryName(categoryId: number, newName: string) {
    this._budgetData.update((budgetData) => {
      const category = budgetData.categories.find(
        (cat) => cat.id === categoryId
      );
      if (category) {
        category.name = newName;
      }
      return budgetData;
    });
    this._budgetData$.next(this._budgetData());
  }
  public updateSubCategoryName(
    categoryId: number,
    subCategoryId: number,
    newName: string
  ) {
    this._budgetData.update((budgetData) => {
      const category = budgetData.categories.find(
        (cat) => cat.id === categoryId
      );
      if (category) {
        const subCategory = category.subCategories.find(
          (subCat) => subCat.id === subCategoryId
        );
        if (subCategory) {
          subCategory.name = newName;
        }
      }
      return budgetData;
    });
    this._budgetData$.next(this._budgetData());
  }
  public addCategory(categoryName: string, parentCategoryName: string) {
    this._budgetData.update((budgetData) => {
      const parentCategory = budgetData.categories.find(
        (category) => category.name === parentCategoryName
      );
      if (parentCategory) {
        const newSubCategoryId = parentCategory.subCategories.length
          ? Math.max(
              ...parentCategory.subCategories.map((subCat) => subCat.id)
            ) + 1
          : 1;

        parentCategory.subCategories.push({
          id: newSubCategoryId,
          name: categoryName,
          values: {},
        });
      }

      return budgetData;
    });

    this._budgetData$.next(this._budgetData());
  }

  public addParentCategory(parentCategoryName: string) {
    this._budgetData.update((budgetData) => {
      const newCategory = {
        id: budgetData.categories.length + 1,
        name: parentCategoryName,
        subCategories: [
          {
            id: 1,
            name: 'New Sub Category',
            values: {},
          },
        ],
      };
      budgetData.categories.push(newCategory);
      return budgetData;
    });
    this._budgetData$.next(this._budgetData());
  }

  public deleteRow(categoryId: number, subCategoryId: number) {
    this._budgetData.update((budgetData) => {
      const category = budgetData.categories.find(
        (cat) => cat.id === categoryId
      );
      if (category) {
        category.subCategories = category.subCategories.filter(
          (subCat) => subCat.id !== subCategoryId
        );
      }
      return budgetData;
    });
    this._budgetData$.next(this._budgetData());
  }
  public deleteParentCategory(categoryId: number) {
    this._budgetData.update((budgetData) => {
      budgetData.categories = budgetData.categories.filter(
        (cat) => cat.id !== categoryId
      );
      return budgetData;
    });
    this._budgetData$.next(this._budgetData());
  }

  public updateCellValue(
    categoryId: number,
    subCategoryId: number,
    monthKey: string,
    value: number | null
  ) {
    this._budgetData.update((budgetData) => {
      const category = budgetData.categories.find(
        (cat) => cat.id === categoryId
      );
      if (category) {
        const subCategory = category.subCategories.find(
          (subCat) => subCat.id === subCategoryId
        );
        if (subCategory) {
          subCategory.values[monthKey] = value === null ? 0 : value;
        }
      }
      return budgetData;
    });
    this._budgetData$.next(this._budgetData());
  }

  public applyValueToAll(
    categoryId: number,
    subCategoryId: number,
    monthKey: string,
    value: number | null
  ) {
    this._budgetData.update((budgetData) => {
      const category = budgetData.categories.find(
        (cat) => cat.id === categoryId
      );
      if (category) {
        const subCategory = category.subCategories.find(
          (subCat) => subCat.id === subCategoryId
        );
        if (subCategory) {
          budgetData.months.forEach(
            (month) =>
              (subCategory.values[month.yearMonth] = value === null ? 0 : value)
          );
        }
      }
      return budgetData;
    });
    this._budgetData$.next(this._budgetData());
  }

  public getOpeningBalance(monthIndex: number): number {
    if (monthIndex === 0) {
      return 0;
    }

    const profitLoss = this.calculateProfitLoss(monthIndex - 1);
    return this.getClosingBalance(monthIndex - 1);
  }

  public calculateIncome(monthIndex: number): number {
    const month = this._budgetData().months[monthIndex];
    let income = 0;
    this._budgetData()
      .categories.filter(
        (category) =>
          category.name === 'Income' || category.name === 'Other Income'
      )
      .forEach((category) => {
        category.subCategories.forEach((subCategory) => {
          income += subCategory.values[month.yearMonth] ?? 0;
        });
      });
    return income;
  }

  public calculateExpenses(monthIndex: number): number {
    const month = this._budgetData().months[monthIndex];
    let expenses = 0;
    this._budgetData()
      .categories.filter(
        (category) =>
          category.name === 'Expenses' || category.name === 'Salaries & Wages'
      )
      .forEach((category) => {
        category.subCategories.forEach((subCategory) => {
          expenses += subCategory.values[month.yearMonth] ?? 0;
        });
      });
    return expenses;
  }

  public calculateProfitLoss(monthIndex: number): number {
    return (
      this.calculateIncome(monthIndex) - this.calculateExpenses(monthIndex)
    );
  }

  public getClosingBalance(monthIndex: number): number {
    return (
      this.getOpeningBalance(monthIndex) + this.calculateProfitLoss(monthIndex)
    );
  }

  public calculateCategorySubtotal(categoryId: number, monthIndex: number): number {
    const month = this._budgetData().months[monthIndex];
    let subtotal = 0;
    const category = this._budgetData().categories.find(
      (cat) => cat.id === categoryId
    );
    if (category) {
      category.subCategories.forEach((subCategory) => {
        subtotal += subCategory.values[month.yearMonth] ?? 0;
      });
    }
    return subtotal;
  }

  public calculateTotalExpenses(monthIndex: number): number {
    const expenses = this.calculateExpenses(monthIndex);
    return expenses;
  }

  public calculateTotalIncome(monthIndex: number): number {
    const income = this.calculateIncome(monthIndex);
    return income;
  }
}
