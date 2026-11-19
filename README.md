# Taskflow

An Angular task-management dashboard built from the Senior Front End assignment. It uses standalone components, a lazily loaded task page, signal-based state, reactive forms, and responsive styling.

## Getting started

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Mock data

The assignment data and generator are in `public/data/`. The app loads `tasks.json` and `statistics.json` through Angular's HTTP client. To refresh task dates and regenerate both JSON files:

```bash
node public/data/generate-data.js
```

The data is bundled as static assets; task additions, status changes, and deletions are held in memory and reset on reload.

## Features

- Dashboard statistic cards and a three-column task board
- Task search plus status, priority, and assignee filters
- Create tasks with validated title, description, priority, due date, and assignee
- Move tasks between statuses, and delete them with confirmation
- Loading, retry, and error states for task data
- Responsive dashboard layout with keyboard-accessible labels and reduced-motion support

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Angular development server |
| `npm run build` | Create a production build |
| `npm test` | Run unit tests in Karma |

## Architecture

- `src/app/app.routes.ts` lazy-loads the task-management page.
- `src/app/features/tasks/services/task.service.ts` loads static task and statistics data and exposes task state as signals.
- `src/app/features/tasks/pages/task-manager-page/` owns dashboard state, filtering, task actions, and the reactive form.
- `src/app/features/tasks/components/task-stats/`, `task-board/`, and `task-card/` contain reusable presentational components driven by page inputs and outputs.
- `src/app/features/tasks/models/task.model.ts` defines the task and assignee data contracts.

Task changes are local to the current browser session. A persistent API, authentication, and drag-and-drop are not included in this mock-data implementation.
