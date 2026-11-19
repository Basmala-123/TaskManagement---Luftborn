import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly moveRequested = output<number>();
  readonly deleteRequested = output<Task>();

  isOverdue(): boolean {
    return this.task().status !== 'done' && this.task().dueDate < this.today();
  }

  dueLabel(): string {
    const task = this.task();
    if (task.status === 'done') {
      if (!task.completedAt) {
        return 'Completed';
      }

      const completedDate = new Date(task.completedAt);
      const todayDate = new Date();
      completedDate.setHours(0, 0, 0, 0);
      todayDate.setHours(0, 0, 0, 0);
      const daysSinceCompletion = Math.round(
        (todayDate.getTime() - completedDate.getTime()) / 86_400_000
      );
      if (daysSinceCompletion === 0) {
        return 'Completed today';
      }
      if (daysSinceCompletion === 1) {
        return 'Completed yesterday';
      }
      return `Completed ${completedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })}`;
    }

    const due = new Date(`${task.dueDate}T00:00:00`);
    const today = new Date(`${this.today()}T00:00:00`);
    const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) {
      return `Overdue by ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'}`;
    }
    if (days === 0) {
      return 'Due today';
    }
    return `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
  }

  assigneeFirstName(): string {
    return this.task().assignee.name.split(' ')[0];
  }

  requestDelete(): void {
    this.deleteRequested.emit(this.task());
  }

  private today(): string {
    const date = new Date();
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 10);
  }
}
