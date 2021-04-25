import { 
  Injectable, 
  EventEmitter,
  Type 
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { DatabaseService } from '../database';

export const PATHS = {
  constituencyPicker: 'constituency-picker',
  map: 'map',
  questions: 'questions',
  about: 'about',
  browse: 'browse',
}
export const ADMIN_EMAIL = 'info@kaljarv.com';

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

export const DEFAULT_LOADING_STATE: LoadingState = {type: 'default'};

@Injectable()
export class SharedService {
  public titleIndex: number = 0; // TODO use an Observable instead
  public subtitle: string | Type<any> = ''; // TODO use an Observable instead
  public hideTopBar: boolean = false;
  public lastOpenCandidateDetailsTab: number = 0; // For details-candidate tabs
  public lastOpenCandidateFilter: number = null; // For filter-candidates expansion panels
  public showMapTools: boolean = false;
  public showFeedbackButton: boolean = false;
  public showAllParties: boolean = false; // This will be set by MapComponent based on a subscription to toggleAllParties
  public userEmail: string = '';

  public loadingState = new BehaviorSubject<LoadingState>(DEFAULT_LOADING_STATE);

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

  constructor(
    private database: DatabaseService,
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
  public get activeCandidateId(): string {
    return this._activeCandidateId;
  }

  /*
   * We use this to signal the map avatars.
   * This should only be set by details-candidate.component onInit
   */
  public set activeCandidateId(id: string | null) {
    const changed = this._activeCandidateId !== id;
    this._activeCandidateId = id;
    if (changed)
      this.activeCandidateChanged.emit(id);
  }

  /*
   * Return a dump of the shared state for feedback
   */
  get state(): any {
    return {
      titleIndex: this.titleIndex,
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

}