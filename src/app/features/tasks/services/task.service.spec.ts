import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Task } from '../models/task.model';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let httpTesting: HttpTestingController;

  const task: Task = {
    id: 'task-1',
    title: 'Review the task board',
    description: 'Check the current task board.',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-12-01',
    assignee: {
      id: 'user-1',
      name: 'Jordan Davis',
      avatar: 'JD',
      email: 'jordan@example.com'
    },
    tags: [],
    createdAt: '2026-11-18T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z'
  };
  const statistics = {
    statistics: [
      {
        id: 'stat-001',
        title: 'Total Tasks',
        icon: '📊',
        value: 156,
        change: '+12',
        changeLabel: 'this week',
        changeType: 'positive' as const,
        color: '#1976D2'
      }
    ],
    lastUpdated: task.updatedAt
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(TaskService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads tasks from the mock data endpoint', () => {
    service.loadTasks();
    expect(service.loading()).toBeTrue();

    httpTesting.expectOne('/data/tasks.json').flush({
      tasks: [task],
      meta: { totalCount: 1, lastUpdated: task.updatedAt }
    });
    httpTesting.expectOne('/data/statistics.json').flush(statistics);

    expect(service.tasks()).toEqual([task]);
    expect(service.statistics()).toEqual(statistics.statistics);
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
  });

  it('creates, updates, and deletes tasks in signal state', () => {
    service.createTask(task);
    service.updateStatus(task.id, 'done');

    expect(service.tasks()[0].status).toBe('done');
    expect(service.tasks()[0].completedAt).toBeTruthy();

    service.deleteTask(task.id);
    expect(service.tasks()).toEqual([]);
  });

  it('updates task details and clears completion when reopening a task', () => {
    const completedTask: Task = {
      ...task,
      status: 'done',
      completedAt: '2026-11-17T10:00:00.000Z'
    };
    service.createTask(completedTask);

    service.updateTask(task.id, { title: 'Edited title' });
    expect(service.tasks()[0].title).toBe('Edited title');
    expect(service.tasks()[0].completedAt).toBe(completedTask.completedAt);

    service.updateStatus(task.id, 'todo');
    expect(service.tasks()[0].completedAt).toBeUndefined();
  });

  it('moves a task into a column and applies the drop order', () => {
    const targetTask: Task = { ...task, id: 'task-2', status: 'in_progress' };
    const movingTask: Task = { ...task, id: 'task-1' };
    service.createTask(movingTask);
    service.createTask(targetTask);

    service.moveTaskToStatus(movingTask.id, 'in_progress', [movingTask.id, targetTask.id]);

    expect(service.tasks().map(({ id }) => id)).toEqual([movingTask.id, targetTask.id]);
    expect(service.tasks()[0].status).toBe('in_progress');
  });

  it('reports an error after retrying failed data requests', async () => {
    service.loadTasks();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      httpTesting.expectOne('/data/tasks.json').flush({
        tasks: [task],
        meta: { totalCount: 1, lastUpdated: task.updatedAt }
      });
      httpTesting
        .expectOne('/data/statistics.json')
        .flush('Request failed', { status: 500, statusText: 'Server Error' });
      if (attempt < 2) {
        await new Promise<void>((resolve) => setTimeout(resolve, 510));
      }
    }

    expect(service.error()).toContain('could not load tasks');
    expect(service.loading()).toBeFalse();
  });
});
