import { 
  Component, 
  ElementRef,
  Input, 
  ViewChild
} from '@angular/core';

import {
  AttachmentOptions,
  StepOptions
} from './onboarding.service';


/*
 * <app-onboarding-step>
 *
 * Contains a step used for onboarding. Use inside <app-onboarding-tour>
 */

@Component({
  selector: 'app-onboarding-step',
  template: `
    <div #content>
      <ng-content></ng-content>
    </div>
  `
})
export class OnboardingStepComponent {

  @Input() advanceOnEvent: string;
  @Input() advanceOnSelector: string;
  @Input() attachOn: AttachmentOptions;
  @Input() attachTo: string;
  @Input() title: string;

  @ViewChild('content') content!: ElementRef<HTMLElement>;

  constructor() {}

  public getStepOptions(): StepOptions {

    let opts: StepOptions = {
      text: this.content.nativeElement
    };
    if (this.advanceOnEvent) {
      opts.advanceOn = {
        event: this.advanceOnEvent
      };
      if (this.advanceOnSelector)
        opts.advanceOn.selector = this.advanceOnSelector;
    }
    if (this.attachTo) {
      opts.attachTo = {
        element: this.attachTo
      };
      if (this.attachOn)
        opts.attachTo.on = this.attachOn;
    }
    if (this.title)
      opts.title = this.title;

    return opts;
  }
}