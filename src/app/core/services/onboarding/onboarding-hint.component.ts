import { Component, Input } from '@angular/core';

/*
 * <app-onboarding-hint>
 *
 * Used to mark an optional hint in the content
 * Use the icon input to override the default icon.
 */

@Component({
  selector: 'app-onboarding-hint',
  template: `
    <mat-icon class="onboarding-hint-icon">{{ icon }}</mat-icon>
    <ng-content></ng-content>
  `
})
export class OnboardingHintComponent {

  @Input() icon: string = 'lightbulb';

  constructor() {}
}