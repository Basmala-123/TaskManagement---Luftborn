import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Statistic } from '../../models/task.model';

@Component({
  selector: 'app-task-stats',
  templateUrl: './task-stats.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskStatsComponent {
  readonly statistics = input.required<Statistic[]>();
}
