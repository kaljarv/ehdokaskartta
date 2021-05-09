import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ShepherdService } from 'angular-shepherd';
import { CookieService } from '../../core';



export type AttachmentOptions = 'auto' | 'auto-start' | 'auto-end' | 'top' | 'top-start' | 'top-end' | 
  'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 
  'left-start' | 'left-end';

export interface OnboardingOptions {
  confirmCancel?: boolean;
  modal?: boolean;
  modalNextOnClickAnywhere?: boolean;
  overrideCookie?: boolean;
  tourId?: string;
}

export interface PartialStepOptions {
  [option: string]: any;
};

export interface StepOptions extends PartialStepOptions {
  advanceOn?: {
    selector?: string,
    event: string
  };
  attachTo?: { 
    element: string, 
    on?: AttachmentOptions
  };
  modal?: boolean;
  text: string | HTMLElement;
  title?: string;
}



export const DEFAULT_TOUR_OPTIONS: OnboardingOptions = {
  confirmCancel: false,
  modal: false,
  modalNextOnClickAnywhere: true,
  overrideCookie: false
}
  
export const ONBOARDING_BUTTONS = {
  next: {
    classes: "onboardingButton onboardingButton-next",
    text: "Seuraava",
    action: function next() { this.next(); }
  },
  nextLast: {
    classes: "onboardingButton onboardingButton-next onboardingButton-nextLast",
    text: "Valmis!",
    action: function next() { this.next(); }
  },
  back: {
    classes: "onboardingButton onboardingButton-back",
    secondary: true,
    text: "Edellinen",
    action: function back() { this.back(); }
  },
  backDisabled: {
    classes: "onboardingButton onboardingButton-back onboardingButton-disabled",
    secondary: true,
    text: "Edellinen",
    disabled: true
  },
  complete: {
    classes: "onboardingButton onboardingButton-complete",
    secondary: true,
    text: "Sulje esittely",
    action: function complete() { this.complete(); }
  },
  okay: {
    classes: "onboardingButton onboardingButton-next",
    text: "OK",
    action: function complete() { this.complete(); }
  },
};

export const DEFAULT_STEP_OPTIONS: PartialStepOptions = {
  // beforeShowPromise: function() {
  //   return new Promise<void>(function(resolve) {
  //     setTimeout(function() {
  //       window.scrollTo(0, 0);
  //       resolve();
  //     }, 100);
  //   });
  // },
  buttons: [
    ONBOARDING_BUTTONS.complete,
    ONBOARDING_BUTTONS.back, 
    ONBOARDING_BUTTONS.next, 
  ],
  cancelIcon: {
    enabled: false
  },
  classes: 'onboarding-step',
  modalOverlayOpeningPadding: 10,
  modalOverlayOpeningRadius: 10,
  popperOptions: {
    modifiers: [
      { name: 'offset', options: { offset: [0, 20] } }
    ]
  },
  scrollTo: true
}

export const ONBOARDING_MODAL_OVERLAY_SELECTOR = ".shepherd-modal-overlay-container";

export const ONBOARDING_COOKIE_PREFIX = "Onboarding";



@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  private _currentTourId: string;
  private _modalNextOnClickAnywhere: boolean;
  private _modalOverlay: HTMLElement;

  constructor(
    private cookie: CookieService,
    private router: Router,
    private shepherd: ShepherdService,
  ) {
    // Close onboarding and clear cache whenever we change pages
    this.router.events.pipe(
      filter(evt => evt instanceof NavigationStart)
    ).subscribe(() => this._reset());
  }

  get active(): boolean {
    return this.shepherd.isActive;
  }

  public startOnboarding(steps: StepOptions[], options: OnboardingOptions = {}): void {

    const {modalNextOnClickAnywhere, overrideCookie, tourId, ...tourOptions} = {...DEFAULT_TOUR_OPTIONS, ...options};
    const stepOptions = DEFAULT_STEP_OPTIONS;

    // Check if the user has already seen this tour, 
    // unless forcibly restarted with overrideCookie
    if (!overrideCookie && tourId != null && this.checkCompletion(tourId))
      return;

    // Save current tour id so we can check for it when calling complete
    this._currentTourId = tourId || undefined;

    if (steps.length === 0)
      return;

    // Save parameter to this to be fetched later
    this._modalNextOnClickAnywhere = modalNextOnClickAnywhere;

    // Change the buttons for single step tours and the first step of longer ones
    if (steps.length === 1)
      steps[0].buttons = [ONBOARDING_BUTTONS.okay];
    else {
      steps[0].buttons = DEFAULT_STEP_OPTIONS.buttons.map(b => 
        b === ONBOARDING_BUTTONS.back ? ONBOARDING_BUTTONS.backDisabled : b
      );
      steps[steps.length - 1].buttons = DEFAULT_STEP_OPTIONS.buttons.map(b => 
        b === ONBOARDING_BUTTONS.next ? ONBOARDING_BUTTONS.nextLast : b
      );
    }

    // Add attachTo.element as default advanceOn.selector
    for (const s of steps) {
      // If we advance on click anywhere, let's fill the advance on event here
      if (!s.advanceOn && this._modalNextOnClickAnywhere && s.advanceTo?.element != null)
        s.advanceOn = {event: 'click'}
      // If advance on event is specified but not the selector, default to target
      if (s.advanceOn && s.advanceOn.selector == null)
        s.advanceOn.selector = s.attachTo?.element;
    }

    // If the tour is modal, increase popper offset if modal overlay has padding
    if (tourOptions.modal && stepOptions.modalOverlayOpeningPadding && stepOptions.popperOptions?.modifiers) {
      for (let m of stepOptions?.popperOptions?.modifiers)
        if (m.options?.offset && m.options.offset.length >= 2)
          m.options.offset[1] += stepOptions.modalOverlayOpeningPadding;
    }

    // Close onboarding if it happens to be active
    this.closeOnboarding();

    this.shepherd.modal = tourOptions.modal;
    this.shepherd.confirmCancel = tourOptions.confirmCancel;
    this.shepherd.defaultStepOptions = DEFAULT_STEP_OPTIONS;

    this.shepherd.addSteps(steps);

    // Set up listeners to save completion to cookie
    if (tourId != null) {
      const saveCompletion = () => this.saveCompletion(tourId);
      for (const e of ['complete', 'cancel'])
        this.shepherd.tourObject?.once(e, saveCompletion);
    }

    this._start();
  }

  public restartOnboarding(): void {
    throw new Error("Not implemented!");
  }

  /*
   * Complete the tour
   * If tourId is supplied, we'll only call complete if the current tour id
   * matches that
   */
  public closeOnboarding(tourId?: string): void {

    if (tourId != null && tourId != this._currentTourId)
      return;

    if (!this.shepherd.tourObject)
      return;

    // We have to make this binding in a rather hacky way, as another step
    // might already be scheduled to be shown
    const step = this.shepherd.tourObject.getCurrentStep();
    if (step)
      step.on('show', function cancel() { this.cancel() });
    this.shepherd.complete();
  }

  public nextStep(): void {
    if (this.shepherd.isActive)
      this.shepherd.next();
  }

  private _start(): void {

    this.shepherd.start();

    if (this.shepherd.modal && this._modalNextOnClickAnywhere) {
      this._modalOverlay = document.querySelector(ONBOARDING_MODAL_OVERLAY_SELECTOR);
      if (this._modalOverlay)
        this._modalOverlay.addEventListener('click', (event) => {
          event?.stopPropagation();
          this.nextStep();
        });
    }
  }

  public checkCompletion(tourId: string): boolean {
    if (this.cookie.read(this._getCookieName(tourId)))
      return true;
    return false;
  }

  public saveCompletion(tourId: string): void {
    this.cookie.write(this._getCookieName(tourId), 'complete');
  }

  public removeCompletion(tourId: string): void {
    this.cookie.delete(this._getCookieName(tourId));
  }

  private _getCookieName(tourId: string): string {
    return `${ONBOARDING_COOKIE_PREFIX}_${tourId}`;
  }

  private _reset(): void {
    this._modalNextOnClickAnywhere = undefined;
    this.closeOnboarding();
  }

  public getCurrentStep(): any {
    return this.shepherd.tourObject?.getCurrentStep();
  }
}