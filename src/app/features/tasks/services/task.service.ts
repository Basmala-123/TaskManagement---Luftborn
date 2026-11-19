import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, finalize, forkJoin, retry, tap } from 'rxjs';
import { Statistic, StatisticsResponse, Task, TaskStatus, TasksResponse } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly taskState = signal<Task[]>([]);
  private readonly statisticsState = signal<Statistic[]>([]);

  readonly tasks = this.taskState.asReadonly();
  readonly statistics = this.statisticsState.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadTasks(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      tasks: this.http.get<TasksResponse>('/data/tasks.json'),
      statistics: this.http.get<StatisticsResponse>('/data/statistics.json')
    })
      .pipe(
        retry({ count: 2, delay: 500 }),
        tap((response) => {
          this.taskState.set(this.sortOverdueFirst(response.tasks.tasks));
          this.statisticsState.set(response.statistics.statistics);
        }),
        catchError((error: unknown) => {
          this.error.set(
            error instanceof HttpErrorResponse
              ? 'We could not load tasks. Check your connection and try again.'
              : 'An unexpected error occurred while loading tasks.'
          );
          return EMPTY;
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe();
  }

  createTask(task: Task): void {
    this.taskState.update((tasks) => [task, ...tasks]);
  }

  updateTask(
    taskId: string,
    changes: Partial<
      Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assignee' | 'tags'>
    >
  ): void {
    const updatedAt = new Date().toISOString();
    this.taskState.update((tasks) => {
      const currentTask = tasks.find((task) => task.id === taskId);
      const overdueOrderChanged =
        currentTask !== undefined &&
        ((changes.status !== undefined && changes.status !== currentTask.status) ||
          (changes.dueDate !== undefined && changes.dueDate !== currentTask.dueDate));
      const updatedTasks = tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...changes,
              updatedAt,
              ...(changes.status !== undefined && changes.status !== task.status
                ? { completedAt: changes.status === 'done' ? updatedAt : undefined }
                : {})
          }
          : task
      );
      return overdueOrderChanged ? this.sortOverdueFirst(updatedTasks) : updatedTasks;
    });
  }

  updateStatus(taskId: string, status: TaskStatus): void {
    this.updateTask(taskId, { status });
  }

  moveTaskToStatus(taskId: string, status: TaskStatus, orderedTaskIds: string[]): void {
    this.updateStatus(taskId, status);
    this.reorderTasks(orderedTaskIds);
  }

  reorderTasks(orderedTaskIds: string[]): void {
    const order = new Map(orderedTaskIds.map((taskId, index) => [taskId, index]));
    this.taskState.update((tasks) => {
      const positions = tasks
        .map((task, index) => ({ task, index }))
        .filter(({ task }) => order.has(task.id))
        .sort((left, right) => left.index - right.index);
      const reordered = positions
        .map(({ task }) => task)
        .sort((left, right) => order.get(left.id)! - order.get(right.id)!);
      const next = [...tasks];
      positions.forEach(({ index }, position) => {
        next[index] = reordered[position];
      });
      return next;
    });
  }

  deleteTask(taskId: string): void {
    this.taskState.update((tasks) => tasks.filter((task) => task.id !== taskId));
  }

  private isOverdue(task: Task, today: string): boolean {
    return task.status !== 'done' && task.dueDate < today;
  }

  private sortOverdueFirst(tasks: Task[]): Task[] {
    const date = new Date();
    const today = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);
    return [...tasks].sort(
      (left, right) =>
        Number(this.isOverdue(right, today)) - Number(this.isOverdue(left, today))
    );
  }
}