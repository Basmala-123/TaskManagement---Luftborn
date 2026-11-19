import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/tasks/pages/task-manager-page/task-manager-page').then(
        (module) => module.TaskManagerPage
      )
  },
  { path: '**', redirectTo: '' }
];
