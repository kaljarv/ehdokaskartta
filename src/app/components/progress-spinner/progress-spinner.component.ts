import { 
  Component, 
  Input
} from '@angular/core';

@Component({
  selector: 'app-progress-spinner',
  templateUrl: './progress-spinner.component.html',
  styleUrls: ['./progress-spinner.component.sass'],
})
export class ProgressSpinnerComponent {
  @Input() title: string = "Ladataan…";
  @Input() diameter: number = 100;
  @Input() mode: string = "indeterminate";
  @Input() strokeWidth: number = 10;
  @Input() value: number;

  constructor(
  ) {
  }
}
