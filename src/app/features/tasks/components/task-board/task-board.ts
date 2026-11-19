import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray
} from '@angular/cdk/drag-drop';
import { Task, TaskStatus, TaskStatusOption } from '../../models/task.model';
import { TaskCardComponent } from '../task-card/task-card';

@Component({
  selector: 'app-task-board',
  imports: [CdkDrag, CdkDropList, CdkDropListGroup, TaskCardComponent],
  templateUrl: './task-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskBoardComponent {
  readonly tasks = input.required<Task[]>();
  readonly statuses = input.required<TaskStatusOption[]>();
  readonly moveRequested = output<{ task: Task; direction: number }>();
  readonly editRequested = output<Task>();
  readonly deleteRequested = output<Task>();
  readonly reorderRequested = output<string[]>();
  readonly taskDropRequested = output<{
    taskId: string;
    status: TaskStatus;
    orderedTaskIds: string[];
  }>();

  statusTasks(status: TaskStatus): Task[] {
    return this.tasks().filter((task) => task.status === status);
  }

  requestMove(task: Task, direction: number): void {
    this.moveRequested.emit({ task, direction });
  }

  onTaskDrop(event: CdkDragDrop<Task[], Task[], Task>, status: TaskStatus): void {
    const task = event.item.data;

    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) {
        return;
      }

      const orderedTasks = [...event.container.data];
      moveItemInArray(orderedTasks, event.previousIndex, event.currentIndex);
      this.reorderRequested.emit(orderedTasks.map((item) => item.id));
      return;
    }

    const orderedTasks = [...event.container.data];
    orderedTasks.splice(event.currentIndex, 0, task);
    this.taskDropRequested.emit({
      taskId: task.id,
      status,
      orderedTaskIds: orderedTasks.map((item) => item.id)
    });
  }
}
