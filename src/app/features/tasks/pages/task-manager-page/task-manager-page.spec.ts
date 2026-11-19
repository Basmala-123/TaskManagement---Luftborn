import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { TaskManagerPage } from './task-manager-page';

describe('TaskManagerPage', () => {
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

  let taskServiceStub: {
    tasks: ReturnType<typeof signal<Task[]>>;
    statistics: ReturnType<typeof signal<never[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    loadTasks: jasmine.Spy;
    createTask: jasmine.Spy;
    updateTask: jasmine.Spy;
    updateStatus: jasmine.Spy;
    moveTaskToStatus: jasmine.Spy;
    reorderTasks: jasmine.Spy;
    deleteTask: jasmine.Spy;
  };

  beforeEach(async () => {
    taskServiceStub = {
      tasks: signal([task]),
      statistics: signal([]),
      loading: signal(false),
      error: signal<string | null>(null),
      loadTasks: jasmine.createSpy('loadTasks'),
      createTask: jasmine.createSpy('createTask'),
      updateTask: jasmine.createSpy('updateTask'),
      updateStatus: jasmine.createSpy('updateStatus'),
      moveTaskToStatus: jasmine.createSpy('moveTaskToStatus'),
      reorderTasks: jasmine.createSpy('reorderTasks'),
      deleteTask: jasmine.createSpy('deleteTask')
    };

    await TestBed.configureTestingModule({
      imports: [TaskManagerPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: TaskService, useValue: taskServiceStub }
      ]
    }).compileComponents();
  });

  it('prefills the form and updates an existing task', () => {
    const page = TestBed.createComponent(TaskManagerPage).componentInstance;
    page.openForm(task);
    page.form.patchValue({ title: 'Updated task', status: 'done' });

    page.submitTask();

    expect(taskServiceStub.updateTask).toHaveBeenCalledWith(
      task.id,
      jasmine.objectContaining({
        title: 'Updated task',
        status: 'done',
        assignee: task.assignee
      })
    );
    expect(taskServiceStub.createTask).not.toHaveBeenCalled();
    expect(page.formOpen()).toBeFalse();
  });

  it('uses the selected status when creating a task', () => {
    const page = TestBed.createComponent(TaskManagerPage).componentInstance;
    page.openForm();
    page.form.patchValue({
      title: 'Create a task',
      description: 'Add a task with its selected status.',
      status: 'in_progress',
      dueDate: '2026-12-02',
      assigneeId: task.assignee.id
    });

    page.submitTask();

    expect(taskServiceStub.createTask).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'in_progress' })
    );
  });
});
