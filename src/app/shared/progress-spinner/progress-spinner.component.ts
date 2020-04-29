import { Component, Input, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-progress-spinner',
  templateUrl: './progress-spinner.component.html'
})
export class ProgressSpinnerComponent {
  @Input() title: string = "Ladataan…";
  @Input() diameter: number = 100;
  @Input() strokeWidth: number = 12;
  @Input() valueObservable: EventEmitter<number> = null;
  @Input() value: number;

  constructor(
  ) {
  }
}
