import { Component, 
         DoCheck,
         ViewChild,
         Type,  
         ElementRef
        } from '@angular/core';
import { Router, 
         NavigationStart } from '@angular/router';
import { trigger,
         style,
         state,
         animate,
         transition, } from '@angular/animations';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog,
         MatDialogConfig,
         MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar,
         MatSnackBarRef } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';

import { SharedService, 
         PATHS,
         ADMIN_EMAIL,
         ANIMATION_TIMING,
         ANIMATION_DURATION_MS,
         DEFAULT_LOADING_STATE,
         ForwardOptions,
         LoadingState,
         MatcherService } from './core';

import { DetailsQuestionComponent } from './pages/question-list';
import { DetailsCandidateComponent,
         FilterCandidatesComponent,
         FavouritesListComponent } from './pages/map';
import { FloatingCardService,
         FloatingCardRef,
         FloatingCardConfig,
         FloatingCardConfigOptions } from './components/floating-card';
import { FeedbackFormComponent } from './components';

export const HIDE_TOOLTIPS_DELAY = ANIMATION_DURATION_MS;
export const DIALOG_CONFIG: MatDialogConfig = {
  minWidth:  '24rem',
  maxWidth:  '80vw',
  minHeight: '22rem',
  maxHeight: '80vh',
};
export const SNACK_BAR_DURATION = 5000;
export const SNACK_BAR_DURATION_WITH_ACTION = 7500;

/*
 * Handles main UI, tools, routing and opening of overlays.
 */

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.sass' ],
  animations: [
    trigger('appearFromBottom', [
      transition(':enter', [
        style({
          transform: 'translateY(100%)'
        }),
        animate(ANIMATION_TIMING, style({
          transform: 'translateY(0%)'
        })),
      ]),
      transition(':leave', [
        style({
          transform: 'translateY(0%)'
        }),
        animate(ANIMATION_TIMING, style({
          transform: 'translateY(100%)'
        }))
      ]),
    ]),
    trigger('buttonAppear', [
      transition(':enter', [
        style({
          transform: 'scale(0) translate(50%, 50%)'
        }),
        animate(ANIMATION_TIMING, style({
          transform: 'scale(1) translate(0%, 0%)'
        })),
      ]),
      transition(':leave', [
        style({
          transform: 'scale(1) translate(0%, 0%)'
        }),
        animate(ANIMATION_TIMING, style({
          transform: 'scale(0) translate(50%, 50%)'
        }))
      ]),
    ]),
    trigger('bottomToolsShift', [
      state('default', 
        style({
          bottom: '{{ offset }}',
        }),
        {params: {
          offset: '0px',
        }}),
      state('shifted', 
        style({
          bottom: '{{ offset }}',
        }),
        {params: {
          offset: '0px',
        }}),
      transition('* => *',
        animate(ANIMATION_TIMING)
      ),
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({
          opacity: 0,
        }),
        animate(ANIMATION_TIMING, style({
          opacity: 1,
        })),
      ], {
        params: {
          delay: '0ms'
      }}),
      transition(':leave', [
        style({
          opacity: 1,
        }),
        animate(ANIMATION_TIMING, style({
          opacity: 0,
        })),
      ], {
        params: {
          delay: '0ms'
      }}),
    ])
  ]
})
export class AppComponent implements DoCheck {
  @ViewChild('sideNav') sideNav;
  @ViewChild('filterButtonTooltip') filterButtonTooltip: MatTooltip;
  @ViewChild('partyButtonTooltip') partyButtonTooltip: MatTooltip;
  @ViewChild('favouritesButtonTooltip') favouritesButtonTooltip: MatTooltip;
  @ViewChild('locateButtonTooltip') locateButtonTooltip: MatTooltip;
  @ViewChild('nextButtonBar') nextButtonBar: ElementRef<HTMLElement>;
  public forwardOptions: ForwardOptions;
  public showNextButtonBar: boolean;
  public showNextProgress: boolean;
  public nextProgressValue: number = 0;
  public paths: { [name: string]: string } = PATHS;
  public isLoading: boolean;
  public loadingMessage: string = 'Ladataan…';
  public loadingMode: string = 'indeterminate';
  public loadingValue: number;
  private _floatingCardRef: FloatingCardRef;
  private _dialogRef: MatDialogRef<any>;
  private _snackBarRef: MatSnackBarRef<any>;
  private _doChanges: {
    loadingState?: LoadingState
  } = {};
  
  constructor(
    private router: Router,
    private bottomSheet: MatBottomSheet,
    private dialog: MatDialog, 
    private shared: SharedService,
    private matcher: MatcherService,
    private fcService: FloatingCardService,
    private snackBar: MatSnackBar
  ) {

    this.shared.loadingState.subscribe( state => {
      this._doChanges.loadingState = state;
    });
    this.shared.showQuestion.subscribe( id => 
      this.openBottomSheet(DetailsQuestionComponent, {id: id})
    );
    this.shared.showCandidate.subscribe( id => 
      this.openDetailsCard(DetailsCandidateComponent, {id: id})
    );
    this.shared.hideCandidate.subscribe( () => 
      this.clearDetailsCard()
    );
    this.shared.toggleCandidate.subscribe( id => {
      if (this.shared.activeCandidateId === id) {
        this.clearDetailsCard();
      } else {
        this.openDetailsCard(DetailsCandidateComponent, {id: id});
      }
    });
    this.shared.showCandidateFilters.subscribe( () => 
      this.openBottomSheet(FilterCandidatesComponent, {})
    );
    this.shared.showFavourites.subscribe( () => 
      this.openBottomSheet(FavouritesListComponent, {})
    );
    this.shared.openFeedback.subscribe( () => 
      this.openDialog(FeedbackFormComponent, {})
    );
    this.shared.enableForward.subscribe( options => {
      this.forwardOptions = {...options};
      if (options.showProgress)
        this.showNextProgress = true;
      this.showNextButtonBar = true;
    });
    this.shared.forwardProgress.subscribe( value => {
      this.nextProgressValue = value;
    });
    this.shared.disableForward.subscribe( () => {
      this.clearForward();
    });
    this.shared.navigateForward.subscribe( options => {
      this.forwardOptions = {...options};
      this.goForward();
    });
    this.shared.toggleSideNav.subscribe( () =>
      this.sideNav.toggle()
    );
    this.shared.showMapTooltips.subscribe( () =>
      this.showHideMapTooltips(true)
    );
    this.shared.hideMapTooltips.subscribe( () =>
      this.showHideMapTooltips(false)
    );
    this.shared.showSnackBar.subscribe( options => 
      this.showSnackBar(options)
    );
    this.router.events.pipe(
      filter(evt => evt instanceof NavigationStart)
      ).subscribe(() => this._resetState());
  }

  /*
   * Process any changes here that might take place duting content checking
   */
  ngDoCheck() {
    if (this._doChanges.loadingState) {
      const state = this._doChanges.loadingState;
      this.isLoading = state.type === 'loading';
      this.loadingMessage = state.message;
      this.loadingValue = state.value;
      this.loadingMode = state.value == null ? 'indeterminate' : 'determinate';
      delete this._doChanges.loadingState;
    }
  }

  // Reset to default configuration (on NavigationStart mainly)
  private _resetState(): void {
    this.shared.hideTopBar = false;
    this.shared.loadingState.next(DEFAULT_LOADING_STATE);
    this.sideNav.close();
    this.showHideMapTooltips(false);
    this.shared.showFeedbackButton = true;
    this.clearForward();
    this.clearBottomSheet();
    this.clearDetailsCard();
    this.clearDialog();
    this.scrollToTop();
  }

  public scrollToTop(): void {
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, 0);
    }
  }

  public clearForward(): void {
    this.forwardOptions = null;
    this.showNextButtonBar = false;
    this.showNextProgress = false;
    this.nextProgressValue = 0;
  }

  public openBottomSheet(type, data) {
    this.clearDetailsCard();
    this.bottomSheet.open(type, {data: data});
  }

  public clearBottomSheet(): void {
    this.bottomSheet.dismiss();
  }

  public openDialog(type, data) {
    this.clearDialog();
    this._dialogRef = this.dialog.open(type, {...DIALOG_CONFIG, data: data});
  }

  public clearDialog(): void {
    this.dialog.closeAll();
  }

  public openDetailsCard(type, data): void {
    // If one is already open, close it
    this.clearDetailsCard();
    const fcOptions: FloatingCardConfigOptions = {
      hiddenWhenOpened: true,
    };
    this._floatingCardRef = this.fcService.open(new FloatingCardConfig(type, data, fcOptions));
    // this._floatingCardRef.dismissed.subscribe(() => this._floatingCardRef = null);
  }

  public clearDetailsCard(): void {
    if (this._floatingCardRef)
      this._floatingCardRef.close();
  }

  // TODO: Toggle sidenav on item click for all items
  // TODO: Move bottom tools when sidenav is opened
  public unsetVoterAnswers() {
    this.matcher.unsetVoterAnswers();
    this.router.navigate(['/']);
  }

  public goForward() {
    if (this.forwardOptions.onBefore) {
      this.forwardOptions.onBefore();
    }
    this.router.navigate(this.forwardOptions.path);
    this.clearForward();
  }

  public toggleSidNav(): void {
    // For the sake consistency, this is done in a silly way by routing via the shared component
    // Cf. subscription in the constructor
    this.shared.toggleSideNav.emit();
  }

  public openCandidateFilters(): void {
    // For the sake consistency, this is done in a silly way by routing via the shared component
    // Cf. subscription in the constructor
    this.shared.showCandidateFilters.emit();
  }

  public openFavourites(): void {
    // For the sake consistency, this is done in a silly way by routing via the shared component
    // Cf. subscription in the constructor
    this.shared.showFavourites.emit();
  }
  
  public toggleMapType(): void {
    throw new Error("Not implemented!");
  }

  public toggleShowAllParties(): void {
    this.shared.toggleAllParties.emit();
  }

  public locateSelf(): void {
    this.shared.locateSelf.emit();
  }

  public openFeedback(): void {
    this.shared.openFeedback.emit();
  }

  public showHideMapTooltips(show: boolean = true): void {
    [
      this.filterButtonTooltip,
      this.partyButtonTooltip,
      this.favouritesButtonTooltip,
      this.locateButtonTooltip,
    ].forEach( t => {
      if (t != null)
        show ? t.show() : t.hide(HIDE_TOOLTIPS_DELAY);
    });
  }

  /*
   * Open snack bar with a possible email link or custom action
   * NB. This is super messy
   */
  public showSnackBar(options: {
    message: string, 
    emailTitle?: string, 
    emailBody?: string, 
    emailSubject?: string,
    actionTitle?: string,
    actionFunction?: Function,
  }): void {
    if (options.emailTitle && options.actionTitle) {
      throw new Error("ShowSnackBar cannot be called with both an emailTitle and an actionTitle.");
    }

    if (options.emailTitle) {

      this._snackBarRef = this.snackBar.open(options.message, options.emailTitle, {
        duration: SNACK_BAR_DURATION_WITH_ACTION,
      });
      const url = `mailto:${ADMIN_EMAIL}?subject=${encodeURI(options.emailSubject ? options.emailSubject : '')}&body=${encodeURI(options.emailBody ? options.emailBody : '')}`;
      this._snackBarRef.onAction().subscribe(() => {
        window.open(url, '_blank');
        this._snackBarRef = null;
      });

    } else if (options.actionTitle && options.actionFunction) {

      this._snackBarRef = this.snackBar.open(options.message, options.actionTitle, {
        duration: SNACK_BAR_DURATION_WITH_ACTION,
      });
      this._snackBarRef.onAction().subscribe(() => {
        options.actionFunction();
        this._snackBarRef = null;
      });

    } else {

      this.snackBar.open(options.message, null, {
        duration: SNACK_BAR_DURATION,
      });

    }

  }

  get titleIndex(): number {
    return this.shared.titleIndex;
  }
  
  get subtitle(): string | Type<any> {
    return this.shared.subtitle;
  }

  get hideTopBar(): boolean {
    return this.shared.hideTopBar;
  }

  get showMapTools(): boolean {
    return this.shared.showMapTools;
  }

  get showFeedbackButton(): boolean {
    return this.shared.showFeedbackButton;
  }

  get loadingState(): BehaviorSubject<LoadingState> {
    return this.shared.loadingState;
  }

  get isAlternativeMap(): boolean {
    // TODO
    return false;
  }
  
  get showAllParties(): boolean {
    return this.shared.showAllParties;
  }

  get hasFavourites(): boolean {
    return this.matcher.getFavouriteCandidates().length > 0;
  }

  get hasActiveFilters(): boolean {
    return this.matcher.hasActiveFilters;
  }

  get enableQuestions(): boolean {
    return this.shared.enableQuestions;
  }

  get enableMap(): boolean {
    return this.shared.enableMap;
  }

  get peekHeight(): string | null {
    if (this._floatingCardRef && this._floatingCardRef.isPeeking)
      return this._floatingCardRef.peekHeight;
    if (this.showNextButtonBar && this.nextButtonBar != null)
      return `${this.nextButtonBar.nativeElement.clientHeight}px`;
    return null;
  }

  get bottomToolsShiftTrigger(): {value: string, params: any} {
    const peekHeight = this.peekHeight;
    return peekHeight != null ?
      { value: 'shifted',
        params: {
          offset: this.peekHeight,
        }
      } :
      { value: 'default',
        params: {
          offset: '0px',
        }
      };
  }

  get nextButtonText(): string {
    return this.forwardOptions.title ? this.forwardOptions.title : 'Seuraava';
  }

  get nextProgressText(): string {
    return this.forwardOptions.progressTitle ? this.forwardOptions.progressTitle : '';
  }

}
