import { Component } from '@angular/core';
import { BudgetTableComponent } from './components/budget-table/budget-table.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    BudgetTableComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'budget-builder';
}
