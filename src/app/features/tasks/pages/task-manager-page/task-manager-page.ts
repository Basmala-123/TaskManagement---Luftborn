import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Assignee, Task, TaskPriority, TaskStatus, TaskStatusOption } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { TaskBoardComponent } from '../../components/task-board/task-board';
import { TaskStatsComponent } from '../../components/task-stats/task-stats';

type StatusFilter = TaskStatus | 'all';
type PriorityFilter = TaskPriority | 'all';

@Component({
  selector: 'app-task-manager-page',
  imports: [ReactiveFormsModule, TaskBoardComponent, TaskStatsComponent],
  templateUrl: './task-manager-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskManagerPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  readonly taskService = inject(TaskService);

  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly priorityFilter = signal<PriorityFilter>('all');
  readonly assigneeFilter = signal('all');
  readonly formOpen = signal(false);
  readonly editingTaskId = signal<string | null>(null);
  readonly notice = signal('');
  readonly statuses: TaskStatusOption[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'done', label: 'Done' }
  ];

  readonly assignees = computed(() => {
    const people = new Map<string, Assignee>();
    for (const task of this.taskService.tasks()) {
      people.set(task.assignee.id, task.assignee);
    }
    return [...people.values()];
  });

  readonly filteredTasks = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.taskService.tasks().filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query);
      const matchesStatus =
        this.statusFilter() === 'all' || task.status === this.statusFilter();
      const matchesPriority =
        this.priorityFilter() === 'all' || task.priority === this.priorityFilter();
      const matchesAssignee =
        this.assigneeFilter() === 'all' || task.assignee.id === this.assigneeFilter();
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  });

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', Validators.required],
    priority: ['medium' as TaskPriority, Validators.required],
    status: ['todo' as TaskStatus, Validators.required],
    dueDate: ['', Validators.required],
    assigneeId: ['', Validators.required]
  });

  ngOnInit(): void {
    this.taskService.loadTasks();
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value as StatusFilter);
  }

  setPriorityFilter(value: string): void {
    this.priorityFilter.set(value as PriorityFilter);
  }

  setAssigneeFilter(value: string): void {
    this.assigneeFilter.set(value);
  }

  openForm(task?: Task): void {
    const firstAssignee = this.assignees()[0]?.id ?? '';
    this.editingTaskId.set(task?.id ?? null);
    this.form.reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'medium',
      status: task?.status ?? 'todo',
      dueDate: task?.dueDate ?? this.dateAfterDays(7),
      assigneeId: task?.assignee.id ?? firstAssignee
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingTaskId.set(null);
  }

  submitTask(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const assignee = this.assignees().find((person) => person.id === value.assigneeId);
    if (!assignee) {
      this.notice.set('Choose a valid assignee before saving.');
      return;
    }

    const editingTaskId = this.editingTaskId();
    if (editingTaskId) {
      this.taskService.updateTask(editingTaskId, {
        title: value.title.trim(),
        description: value.description.trim(),
        priority: value.priority,
        status: value.status,
        dueDate: value.dueDate,
        assignee
      });
      this.closeForm();
      this.notice.set('Task updated successfully.');
      return;
    }

    const now = new Date().toISOString();
    const task: Task = {
      id: `task-${Date.now()}`,
      title: value.title.trim(),
      description: value.description.trim(),
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate,
      assignee,
      tags: [],
      createdAt: now,
      updatedAt: now
    };
    this.taskService.createTask(task);
    this.formOpen.set(false);
    this.notice.set('Task created successfully.');
  }

  changeTaskStatus(task: Task, direction: number): void {
    const currentIndex = this.statuses.findIndex((status) => status.value === task.status);
    const nextStatus = this.statuses[currentIndex + direction];
    if (nextStatus) {
      this.taskService.updateStatus(task.id, nextStatus.value);
    }
  }

  moveTaskToStatus(event: {
    taskId: string;
    status: TaskStatus;
    orderedTaskIds: string[];
  }): void {
    this.taskService.moveTaskToStatus(event.taskId, event.status, event.orderedTaskIds);
  }

  removeTask(task: Task): void {
    if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      this.taskService.deleteTask(task.id);
      this.notice.set('Task deleted.');
    }
  }

  private dateAfterDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return this.toDateInput(date);
  }

  private toDateInput(date: Date): string {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 10);
  }
}
