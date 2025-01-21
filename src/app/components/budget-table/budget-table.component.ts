import { NgFor, NgIf } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import {
  MatDatepickerInputEvent,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';
import { BudgetData } from '../../models/budget-data.model';
import { BudgetService } from '../../services/budget.service';
import { Category, SubCategory } from '../../models/category.model';
@Component({
  selector: 'app-budget-table',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  templateUrl: './budget-table.component.html',
  styleUrls: ['./budget-table.component.scss'],
})
export class BudgetTableComponent implements AfterViewInit, OnDestroy {
  @ViewChild('firstInput') firstInput!: ElementRef;
  public budgetData = signal<BudgetData>({ categories: [], months: [] });
  public startMonth = signal<Date>(new Date());
  public endMonth = signal<Date>(new Date());
  private selectedCell: {
    categoryId: number;
    subCategoryId: number;
    monthIndex: number;
  } | null = null;
  public isContextMenuVisible = signal(false);
  public contextMenuX = signal(0);
  public contextMenuY = signal(0);
  private destroy$ = new Subject<void>();

  constructor(private budgetService: BudgetService) {
    this.startMonth.set(this.budgetService.startMonth());
    this.endMonth.set(this.budgetService.endMonth());
    this.budgetService.budgetData
      .pipe(takeUntil(this.destroy$))
      .subscribe((budgetData) => {
        this.budgetData.set(budgetData);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.firstInput?.nativeElement.focus();
  }
  public handleCellFocus(
    categoryId: number,
    subCategoryId: number,
    monthIndex: number
  ) {
    this.selectedCell = { categoryId, subCategoryId, monthIndex };
  }

  public addCategory(categoryName: string, parentCategoryName: string) {
    this.budgetService.addCategory(categoryName, parentCategoryName);
  }

  public updateCategoryName(categoryId: number, event: any) {
    const newName = event.target.value;
    this.budgetService.updateCategoryName(categoryId, newName);
  }

  public updateSubCategoryName(categoryId: number, subCategoryId: number, event: any) {
    const newName = event.target.value;
    this.budgetService.updateSubCategoryName(
      categoryId,
      subCategoryId,
      newName
    );
  }
  public addParentCategory(parentCategoryName: string) {
    this.budgetService.addParentCategory(parentCategoryName);
  }

  public deleteRow(categoryId: number, subCategoryId: number) {
    this.budgetService.deleteRow(categoryId, subCategoryId);
  }

  public deleteParentCategory(categoryId: number) {
    this.budgetService.deleteParentCategory(categoryId);
  }

  public updateCellValue(
    categoryId: number,
    subCategoryId: number,
    monthIndex: number,
    event: any
  ) {
    const month = this.budgetData().months[monthIndex];
    const value =
      event.target.value === '' ? null : parseFloat(event.target.value);
    this.budgetService.updateCellValue(
      categoryId,
      subCategoryId,
      month.yearMonth,
      value
    );
  }
  public trackBySubCategory(index: number, subCategory: SubCategory) {
    return subCategory.id;
  }
  public trackByMonth(index: number, month: any) {
    return month.yearMonth;
  }
  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.selectedCell) return;
    const { categoryId, subCategoryId, monthIndex } = this.selectedCell;

    const categories = this.budgetData().categories;
    const currentCategory = categories.find((cat) => cat.id === categoryId);
    if (!currentCategory) return;
    const currentSubCategoryIndex = currentCategory.subCategories.findIndex(
      (subCat) => subCat.id === subCategoryId
    );

    if (event.key === 'Enter') {
      const lastSubcategory = currentCategory.subCategories.length - 1;
      this.addCategory('new Category', currentCategory.name);
      const nextSubCatIndex = currentSubCategoryIndex + 1;
      if (nextSubCatIndex <= lastSubcategory) {
        this.selectedCell = {
          categoryId: categoryId,
          subCategoryId: currentCategory.subCategories[nextSubCatIndex].id,
          monthIndex: monthIndex,
        };
      }
      event.preventDefault();
    } else if (event.key === 'Tab') {
      const lastMonth = this.budgetData().months.length - 1;
      if (monthIndex === lastMonth) {
        const lastSubcategory = currentCategory.subCategories.length - 1;
        if (currentSubCategoryIndex < lastSubcategory) {
          this.selectedCell = {
            categoryId: categoryId,
            subCategoryId:
              currentCategory.subCategories[currentSubCategoryIndex + 1].id,
            monthIndex: 0,
          };
        } else {
          const nextCategory =
            categories[
              categories.findIndex((cat) => cat.id === categoryId) + 1
            ];
          if (nextCategory) {
            this.selectedCell = {
              categoryId: nextCategory.id,
              subCategoryId: nextCategory.subCategories[0]?.id,
              monthIndex: 0,
            };
          }
        }
      } else {
        this.selectedCell = {
          categoryId: categoryId,
          subCategoryId: subCategoryId,
          monthIndex: monthIndex + 1,
        };
      }

      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      if (currentSubCategoryIndex > 0) {
        this.selectedCell = {
          categoryId: categoryId,
          subCategoryId:
            currentCategory.subCategories[currentSubCategoryIndex - 1].id,
          monthIndex: monthIndex,
        };
      }
      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      const lastSubcategory = currentCategory.subCategories.length - 1;
      if (currentSubCategoryIndex < lastSubcategory) {
        this.selectedCell = {
          categoryId: categoryId,
          subCategoryId:
            currentCategory.subCategories[currentSubCategoryIndex + 1].id,
          monthIndex: monthIndex,
        };
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && this.selectedCell) {
      if (monthIndex > 0)
        this.selectedCell = {
          categoryId: categoryId,
          subCategoryId: subCategoryId,
          monthIndex: monthIndex - 1,
        };
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && this.selectedCell) {
      const lastMonth = this.budgetData().months.length - 1;
      if (monthIndex < lastMonth)
        this.selectedCell = {
          categoryId: categoryId,
          subCategoryId: subCategoryId,
          monthIndex: monthIndex + 1,
        };
      event.preventDefault();
    }
    if (
      (this.selectedCell.monthIndex && event.key === 'ArrowUp') ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight'
    ) {
      const cell = document.querySelector<HTMLElement>(
        `#cell-${this.selectedCell.categoryId}-${this.selectedCell.subCategoryId}-${this.selectedCell.monthIndex}`
      );
      if (cell) {
        cell.focus();
      }
    }
  }

  public onContextMenu(
    event: MouseEvent,
    categoryId: number,
    subCategoryId: number,
    monthIndex: number
  ) {
    event.preventDefault();
    this.selectedCell = { categoryId, subCategoryId, monthIndex };
    this.contextMenuX.set(event.clientX);
    this.contextMenuY.set(event.clientY);
    this.isContextMenuVisible.set(true);
  }

  private closeContextMenu() {
    this.isContextMenuVisible.set(false);
  }

  public applyValueToAll() {
    if (this.selectedCell) {
      const month = this.budgetData().months[this.selectedCell.monthIndex];
      const cell = document.querySelector<HTMLInputElement>(
        `#cell-${this.selectedCell.categoryId}-${this.selectedCell.subCategoryId}-${this.selectedCell.monthIndex}`
      );
      if (cell) {
        const value = cell.value === '' ? null : parseFloat(cell.value);
        this.budgetService.applyValueToAll(
          this.selectedCell.categoryId,
          this.selectedCell.subCategoryId,
          month.yearMonth,
          value
        );
      }

      this.closeContextMenu();
    }
  }

  public onStartMonthChange(event: MatDatepickerInputEvent<Date>) {
    if (event.value) this.budgetService.updateStartMonth(event.value);
  }

  public onEndMonthChange(event: MatDatepickerInputEvent<Date>) {
    if (event.value) this.budgetService.updateEndMonth(event.value);
  }

  public getOpeningBalance(monthIndex: number): number {
    return this.budgetService.getOpeningBalance(monthIndex);
  }

  public getProfitLoss(monthIndex: number): number {
    return this.budgetService.calculateProfitLoss(monthIndex);
  }

  public getTotalExpenses(monthIndex: number): number {
    return this.budgetService.calculateTotalExpenses(monthIndex);
  }

  public getTotalIncome(monthIndex: number): number {
    return this.budgetService.calculateTotalIncome(monthIndex);
  }

  public getSubtotal(categoryId: number, monthIndex: number) {
    return this.budgetService.calculateCategorySubtotal(categoryId, monthIndex);
  }

  public getClosingBalance(monthIndex: number): number {
    return this.budgetService.getClosingBalance(monthIndex);
  }
}
