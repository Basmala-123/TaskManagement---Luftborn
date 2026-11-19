import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Task, TaskStatus, TaskStatusOption } from '../../models/task.model';
import { TaskCardComponent } from '../task-card/task-card';

@Component({
  selector: 'app-task-board',
  imports: [TaskCardComponent],
  templateUrl: './task-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskBoardComponent {
  readonly tasks = input.required<Task[]>();
  readonly statuses = input.required<TaskStatusOption[]>();
  readonly moveRequested = output<{ task: Task; direction: number }>();
  readonly deleteRequested = output<Task>();

  statusTasks(status: TaskStatus): Task[] {
    return this.tasks()
      .filter((task) => task.status === status)
      .sort((left, right) => Number(this.isOverdue(right)) - Number(this.isOverdue(left)));
  }

  requestMove(task: Task, direction: number): void {
    this.moveRequested.emit({ task, direction });
  }

  private isOverdue(task: Task): boolean {
    const date = new Date();
    const today = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);
    return task.status !== 'done' && task.dueDate < today;
  }
}
