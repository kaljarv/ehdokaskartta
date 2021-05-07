import { 
  Component, 
  ContentChildren, 
  Input, 
  OnDestroy,
  QueryList,
  ViewEncapsulation
} from '@angular/core';

import {
  AttachmentOptions,
  OnboardingOptions,
  OnboardingService,
  StepOptions
} from './onboarding.service';
import {
  OnboardingStepComponent
} from './onboarding-step.component';

/*
 * <app-onboarding-tour>
 *
 * Contains the steps used for onboarding. These are not displayed in the page flow. 
 * Usage:
 * <app-onboarding-tour>
 *    <app-onboarding-step attachTo="#elementId"
 *                         attachOn="bottom"
 *                         title="Step title">
 *      <p>Step content</p>
 *      <app-onboarding-hint>
 *        Optional hint.
 *      </app-onboarding-hint>
 *      <app-onboarding-hint>
 *        Optional hint 2.
 *      </app-onboarding-hint>
 *   </app-onboarding-step>
 * </app-onboarding-tour>
 */

@Component({
  selector: 'app-onboarding-tour',
  template: '<ng-content></ng-content>',
  styleUrls: ['./onboarding-tour.component.sass'],
  // We need this to target Shepherd's internal styles
  encapsulation: ViewEncapsulation.None
})
export class OnboardingTourComponent
  implements OnDestroy {

  /*
   * Default to use for steps.
   */
  @Input() attachOn: AttachmentOptions = 'auto';

  /*
   * Whether tour is modal.
   */
  @Input() modal: boolean;

  /*
   * If tour is modal, whether to advance on clicking anwyhere.
   */
  @Input() modalNextOnClickAnywhere: boolean;

  /*
   * The ids of the tours contained in this page's overlays
   * The completion cookies for these will be reset when this
   * tour is forcibly restarted.
   */
  @Input() subTourIds: string[];

  /*
   * We use this to keep track which tours have been shown
   */
  @Input() tourId: string;

  @ContentChildren(OnboardingStepComponent)
  steps: QueryList<OnboardingStepComponent>;

  constructor(
    private onboarding: OnboardingService
  ) {}

  get active(): boolean {
    return this.onboarding.active;
  }

  ngOnDestroy(): void {
    this.steps = null;
  }

  public start(overrideCookie?: boolean): void {

    const opts: OnboardingOptions = {};

    for (let k of ['modal', 'modalNextOnClickAnywhere', 'tourId'])
      if (this[k] != null)
        opts[k] = this[k];
    
    if (overrideCookie != null)
      opts.overrideCookie = overrideCookie;

    this.onboarding.startOnboarding(this.getSteps(), opts);
  }

  public restart(): void {

    // Clear the completion statuses of this tour and its subtours
    const ids = [];

    if (this.tourId) 
      ids.push(this.tourId);
    if (this.subTourIds) 
      ids.push(...this.subTourIds);

    for (const id of ids)
      this.onboarding.removeCompletion(id);

    // Restart this
    this.start();
  }

  public complete(disregardTourId: boolean = false): void {

    if (disregardTourId || this.tourId == null)
      this.onboarding.closeOnboarding();
    
    this.onboarding.closeOnboarding(this.tourId);
  }

  public getCurrentStep(): any {
    this.onboarding.getCurrentStep();
  }

  public getSteps(): StepOptions[] {

    // Get steps and add defaults from this
    if (this.steps && this.steps.length > 0)
      return this.steps.map(s => ({
          attachOn: this.attachOn,
          ...s.getStepOptions()
        }));
  
    throw new Error("OnboardingTourComponent has no steps!");
  }
}

