import { 
  Injectable, 
  EventEmitter,
  Type 
} from '@angular/core';
import { 
  BehaviorSubject 
} from 'rxjs';

import {
  MatcherService
} from '../matcher';
import { 
  DatabaseService 
} from '../database';

export const PATHS = {
  constituencyPicker: 'constituency-picker',
  map: 'map',
  questions: 'questions',
  about: 'about',
  browse: 'browse',
}

export const ADMIN_EMAIL = 'info@kaljarv.com';

export const ANIMATION_DURATION_MS = 225;
export const ANIMATION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const ANIMATION_TIMING = `${ANIMATION_DURATION_MS}ms ${ANIMATION_EASING}`;

export interface ForwardOptions {
  path: any[],            // The path array to navigate
  title?: string,         // Optional button title to override the default one
  progressTitle?: string, // Optional progress indicator title
  showProgress?: boolean, // If true a progress indicator is show
  onBefore?: () => void,  // An optional callback function that is called before navigating
}

export type LoadingState = {
  type: 'loading' | 'loaded' | 'default',
  message?: string,
  value?: number
}

export type Onboarding = {
  restart?: () => void
} | null;

/*
 * These must be reported with each view change
 */
export interface AppStateOptionsOverlay {
  loadingState?: LoadingState;
  onboarding?: Onboarding;
}
export interface AppStateOptionsPage extends AppStateOptionsOverlay {
  currentPage: PageName;
  subtitle?: string | Type<any>;
  hideTopBar?: boolean;
  showMapTools?: boolean;
  showFeedbackButton?: boolean;
}




export type ToggleSideNavOptions = {
  action: 'open' | 'close' | 'toggle',
  onComplete?: () => void
}

export type PageName = 'constituencyPicker' | 'questions' | 'map' | 'browse' | 'titleScreen' | 'about';

export const DEFAULT_LOADING_STATE: LoadingState = {type: 'default'};

export const DEFAULT_APP_STATE_OPTIONS_OVERLAY: AppStateOptionsOverlay = {
  loadingState: DEFAULT_LOADING_STATE,
  onboarding: null
}

export const DEFAULT_APP_STATE_OPTIONS_PAGE: AppStateOptionsPage = {
  ...DEFAULT_APP_STATE_OPTIONS_OVERLAY,
  currentPage: null,
  subtitle: null,
  hideTopBar: false,
  showMapTools: false,
  showFeedbackButton: true
}

@Injectable()
export class SharedService {

  public hideDistribution: boolean = false;
  public hideTopBar: boolean = false;
  public lastOpenCandidateDetailsTab: number = 0; // For details-candidate tabs
  public lastOpenCandidateFilter: number = null; // For filter-candidates expansion panels
  public onboarding: Onboarding;
  public showMapTools: boolean = false;
  public showFeedbackButton: boolean = false;
  public showAllParties: boolean = false; // This will be set by MapComponent based on a subscription to toggleAllParties
  public userEmail: string = '';

  readonly loadingState = new BehaviorSubject<LoadingState>(DEFAULT_LOADING_STATE);
  readonly topBarDataChanged = new EventEmitter<{
    currentPage: PageName,
    subtitle: string | Type<any>
  }>();
  readonly showQuestion = new EventEmitter<string>();
  readonly showCandidate = new EventEmitter<string>();
  readonly toggleCandidate = new EventEmitter<string>();
  readonly hideCandidate = new EventEmitter<void>();
  readonly activeCandidateChanged =  new EventEmitter<string | null>();
  readonly showCandidateFilters = new EventEmitter<void>();
  readonly showFavourites = new EventEmitter<void>();
  readonly toggleAllParties = new EventEmitter<string>();
  readonly enableForward = new EventEmitter<ForwardOptions>(true);
  readonly disableForward = new EventEmitter<void>();
  readonly forwardProgress = new EventEmitter<number>();
  readonly navigateForward = new EventEmitter<ForwardOptions>();
  readonly toggleSideNav = new EventEmitter<ToggleSideNavOptions | void>();
  readonly locateSelf = new EventEmitter<void>();
  readonly openFeedback = new EventEmitter<void>();
  readonly minimiseTopBar = new EventEmitter<void>();
  readonly showMapTooltips = new EventEmitter<void>();
  readonly hideMapTooltips = new EventEmitter<void>();
  readonly showSnackBar = new EventEmitter<{
    message: string, 
    emailTitle?: string, 
    emailBody?: string, 
    emailSubject?: string,
    actionTitle?: string,
    actionFunction?: Function,
  }>();
  // A catch-all for all map interactions
  readonly mapInteraction = new EventEmitter<void>();
  readonly restartOnboarding = new EventEmitter<void>();

  private _activeCandidateId: string = null;
  private _currentPage: PageName;
  private _pageOnboarding: Onboarding;
  private _subtitle: string | Type<any> = '';

  constructor(
    private database: DatabaseService,
    private matcher: MatcherService
  ) {
    // Set up mapInteraction
    this.showCandidate.subscribe( id => {
      this.mapInteraction.emit();
    });
    this.toggleCandidate.subscribe( id => {
      this.mapInteraction.emit();
    });
    this.hideCandidate.subscribe( () => {
      this.mapInteraction.emit();
    });
    this.activeCandidateChanged.subscribe( id => {
      if (id != null)
        this.logEvent('candidate_show', {id});
    });
    this.showCandidateFilters.subscribe( () => {
      this.mapInteraction.emit();
      this.logEvent('filters_show');
    });
    this.showFavourites.subscribe( () => {
      this.mapInteraction.emit();
      this.logEvent('favourites_show');
    });
    this.toggleAllParties.subscribe( () => {
      this.mapInteraction.emit();
      this.logEvent('parties_show');
    });
    this.locateSelf.subscribe( () => {
      this.mapInteraction.emit();
      this.logEvent('locate_self');
    });
    this.toggleSideNav.subscribe( () => {
      this.logEvent('side_nav_toggle');
    });
  }

  /*
   * We use this to signal the map avatars.
   */
  get activeCandidateId(): string {
    return this._activeCandidateId;
  }

  /*
   * We use this to signal the map avatars.
   * This should only be set by details-candidate.component onInit
   */
  set activeCandidateId(id: string | null) {
    const changed = this._activeCandidateId !== id;
    this._activeCandidateId = id;
    if (changed)
      this.activeCandidateChanged.emit(id);
  }

  get currentPage(): PageName {
    return this._currentPage;
  }
  set currentPage(value: PageName) {
    this._currentPage = value;
    this._emitTopBarDataChanged();
  }

  get subtitle(): string | Type<any> {
    return this._subtitle;
  }
  set subtitle(value: string | Type<any>) {
    this._subtitle = value;
    this._emitTopBarDataChanged();
  }

  get enableMap(): boolean {
    return this.matcher.hasEnoughAnswersForMapping;
  }

  get enableQuestions(): boolean {
    return this.matcher.constituencyId != null;
  }

  get voterDisabled(): boolean {
    return this.matcher.voterDisabled;
  }

  /*
   * Return a dump of the shared state for feedback
   */
  get state(): any {
    return {
      currentPage: this.currentPage,
      // subtitle: this.subtitle.toString(),
      lastOpenCandidateDetailsTab: this.lastOpenCandidateDetailsTab,
      lastOpenCandidateFilter: this.lastOpenCandidateFilter,
      activeCandidateId: this.activeCandidateId,
      showMapTools: this.showMapTools,
      showFeedbackButton: this.showFeedbackButton,
      showAllParties: this.showAllParties,
      // userEmail: this.userEmail,
    }
  }

  /*
   * Call either of these on each page load
   * and on overlay close
   */
  public reportPageOpen(options: AppStateOptionsPage): void {
    this._resetState({...DEFAULT_APP_STATE_OPTIONS_PAGE, ...options});
    // We cache the possible onboarding here so that we can restore it
    // on overlay close
    this._pageOnboarding = options.onboarding || null;
  }

  public reportOverlayOpen(options: AppStateOptionsOverlay): void {
    this._resetState({...DEFAULT_APP_STATE_OPTIONS_OVERLAY, ...options});
  }

  public reportOverlayClose(): void {
    // Restore onboarding for the currently open page
    this.onboarding = this._pageOnboarding || null;
  }

  private _resetState(options: any): void {
    const {loadingState, ...otherOpts} = options;
    for (const o in otherOpts)
      this[o] = options[o];
    this.loadingState.next(loadingState);
  }

  public clamp(value: number, min: number = 0.0, max: number = 1.0): number {
    return Math.min(Math.max(min, value), max);
  }

  public logEvent(eventName: string, eventParams: any = {}): void {
    this.database.logEvent(eventName, eventParams);
  }

  private _emitTopBarDataChanged(): void {
    this.topBarDataChanged.emit({
      currentPage: this.currentPage, 
      subtitle: this.subtitle
    })
  }

}