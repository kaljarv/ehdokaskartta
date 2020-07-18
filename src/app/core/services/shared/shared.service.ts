import { Injectable, 
         EventEmitter,
         Type } from '@angular/core';

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

@Injectable()
export class SharedService {
  public title: string = 'Tervetuloa Ehdokaskartalle'; // TODO use an Observable instead
  public subtitle: string | Type<any> = ''; // TODO use an Observable instead
  public lastOpenCandidateDetailsTab: number = 0; // For details-candidate tabs
  public lastOpenCandidateFilter: number = null; // For filter-candidates expansion panels
  public activeCandidateId: string; // We use this to signal the map avatars
  public showMapTools: boolean = false;
  public showFeedbackButton: boolean = false;
  public showAllParties: boolean = false; // This will be set by MapComponent based on a subscription to toggleAllParties
  public userEmail: string = '';

  public showQuestion = new EventEmitter<string>();
  public showCandidate = new EventEmitter<string>();
  public toggleCandidate = new EventEmitter<string>();
  public hideCandidate = new EventEmitter<void>();
  public showCandidateFilters = new EventEmitter<void>();
  public showFavourites = new EventEmitter<void>();
  public toggleAllParties = new EventEmitter<string>();
  public enableForward = new EventEmitter<ForwardOptions>();
  public disableForward = new EventEmitter<void>();
  public forwardProgress = new EventEmitter<number>();
  public navigateForward = new EventEmitter<ForwardOptions>();
  public toggleSideNav = new EventEmitter<void>();
  public locateSelf = new EventEmitter<void>();
  public openFeedback = new EventEmitter<void>();
  public hideTopBar = new EventEmitter<void>();
  public minimiseTopBar = new EventEmitter<void>();
  public showMapTooltips = new EventEmitter<void>();
  public hideMapTooltips = new EventEmitter<void>();
  public showSnackBar = new EventEmitter<{
    message: string, 
    emailTitle?: string, 
    emailBody?: string, 
    emailSubject?: string
  }>();
  // A catch-all for all map interactions
  public mapInteraction = new EventEmitter<void>();

  constructor(
    private database: DatabaseService,
  ) {
    // Set up mapInteraction
    this.showCandidate.subscribe( id => {
      this.mapInteraction.emit();
      this.logEvent('candidate_show', {id});
    });
    this.toggleCandidate.subscribe( id => {
      this.mapInteraction.emit();
      if (this.activeCandidateId !== id)
        this.logEvent('candidate_show', {id});
    });
    this.hideCandidate.subscribe( () => {
      this.mapInteraction.emit();
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

  public clamp(value: number, min: number = 0.0, max: number = 1.0): number {
    return Math.min(Math.max(min, value), max);
  }

  public logEvent(eventName: string, eventParams: any = {}): void {
    this.database.logEvent(eventName, eventParams);
  }

  /*
   * Return a dump of the shared state for feedback
   */
  get state(): any {
    return {
      title: this.title,
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
}