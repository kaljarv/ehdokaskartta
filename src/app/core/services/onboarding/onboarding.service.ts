import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ShepherdService } from 'angular-shepherd';



export type AttachmentOptions = 'auto' | 'auto-start' | 'auto-end' | 'top' | 'top-start' | 'top-end' | 
  'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 
  'left-start' | 'left-end';

export interface PartialStepOptions {
  [option: string]: any;
};

export interface StepOptions extends PartialStepOptions {
  attachTo: { 
    element: string, 
    on?: AttachmentOptions
  };
  title: string;
  text: string | HTMLElement;
}



@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  public buttons = {
    next: {
      classes: "onboarding-button-next",
      text: "Seuraava",
      type: "next"
    },
    back: {
      classes: "onboarding-button-back",
      secondary: true,
      text: "Edellinen",
      type: "back"
    },
    complete: {
      classes: "onboarding-button-complete",
      secondary: true,
      text: "Sulje esittely",
      action: () => this.shepherd.complete()
    },
    okay: {
      classes: "onboarding-button-next",
      text: "OK",
      action: () => this.shepherd.complete()
    },
  };

  public defaultStepOptions: PartialStepOptions = {
    beforeShowPromise: function() {
      return new Promise<void>(function(resolve) {
        setTimeout(function() {
          window.scrollTo(0, 0);
          resolve();
        }, 500);
      });
    },
    buttons: [
      this.buttons.complete,
      this.buttons.back, 
      this.buttons.next, 
    ],
    cancelIcon: {
      enabled: true
    },
    // classes: 'debug',
    // highlightClass: 'highlight',
    scrollTo: true,
    // when: {
    //   show: () => {
    //     console.log('show step');
    //   },
    //   hide: () => {
    //     console.log('hide step');
    //   }
    // }
  }

  public confirmCancel: boolean = false;
  public modal: boolean = false;

  private _lastSteps: StepOptions[];

  constructor(
    private router: Router,
    private shepherd: ShepherdService,
  ) {
    // Close onboarding and clear cache whenever we change pages
    this.router.events.pipe(
      filter(evt => evt instanceof NavigationStart)
      ).subscribe(() => {
        this._lastSteps = undefined;
        this.closeOnboarding();
      });
  }

  public startOnboarding(steps: StepOptions[]): void {

    this._lastSteps = steps;

    if (steps.length === 1)
      steps[0].buttons = [this.buttons.okay];

    this.shepherd.defaultStepOptions = this.defaultStepOptions;
    this.shepherd.modal = this.modal;
    this.shepherd.confirmCancel = this.confirmCancel;
    this.shepherd.addSteps(steps);
    this.shepherd.start();
  }

  public restartOnboarding(): void {
    if (this._lastSteps?.length > 0)
      this.shepherd.start();
    else
      throw new Error("Shepherd has no steps!")
  }

  public closeOnboarding(): void {
    if (this.shepherd.isActive)
      this.startOnboarding(this._lastSteps);
  }
}