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
          this.taskState.set(response.tasks.tasks);
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

  updateStatus(taskId: string, status: TaskStatus): void {
    const updatedAt = new Date().toISOString();
    this.taskState.update((tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              updatedAt,
              completedAt: status === 'done' ? updatedAt : undefined
            }
          : task
      )
    );
  }

  deleteTask(taskId: string): void {
    this.taskState.update((tasks) => tasks.filter((task) => task.id !== taskId));
  }
}