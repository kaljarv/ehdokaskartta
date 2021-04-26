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

export type PageName = 'constituencyPicker' | 'questions' | 'map' | 'browse' | 'titleScreen' | 'about';

export const DEFAULT_LOADING_STATE: LoadingState = {type: 'default'};

@Injectable()
export class SharedService {
  public hideDistribution: boolean = false;
  public hideTopBar: boolean = false;
  public lastOpenCandidateDetailsTab: number = 0; // For details-candidate tabs
  public lastOpenCandidateFilter: number = null; // For filter-candidates expansion panels
  public showMapTools: boolean = false;
  public showFeedbackButton: boolean = false;
  public showAllParties: boolean = false; // This will be set by MapComponent based on a subscription to toggleAllParties
  public userEmail: string = '';

  public loadingState = new BehaviorSubject<LoadingState>(DEFAULT_LOADING_STATE);

  public topBarDataChanged = new EventEmitter<{
    currentPage: PageName,
    subtitle: string | Type<any>
  }>();
  public showQuestion = new EventEmitter<string>();
  public showCandidate = new EventEmitter<string>();
  public toggleCandidate = new EventEmitter<string>();
  public hideCandidate = new EventEmitter<void>();
  public activeCandidateChanged =  new EventEmitter<string | null>();
  public showCandidateFilters = new EventEmitter<void>();
  public showFavourites = new EventEmitter<void>();
  public toggleAllParties = new EventEmitter<string>();
  public enableForward = new EventEmitter<ForwardOptions>(true);
  public disableForward = new EventEmitter<void>();
  public forwardProgress = new EventEmitter<number>();
  public navigateForward = new EventEmitter<ForwardOptions>();
  public toggleSideNav = new EventEmitter<void>();
  public locateSelf = new EventEmitter<void>();
  public openFeedback = new EventEmitter<void>();
  public minimiseTopBar = new EventEmitter<void>();
  public showMapTooltips = new EventEmitter<void>();
  public hideMapTooltips = new EventEmitter<void>();
  public showSnackBar = new EventEmitter<{
    message: string, 
    emailTitle?: string, 
    emailBody?: string, 
    emailSubject?: string,
    actionTitle?: string,
    actionFunction?: Function,
  }>();
  // A catch-all for all map interactions
  public mapInteraction = new EventEmitter<void>();

  private _activeCandidateId: string = null;
  public _currentPage: PageName;
  public _subtitle: string | Type<any> = '';

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