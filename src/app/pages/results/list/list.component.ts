import {
  AfterViewInit,
  Component,
  DoCheck,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationStart,
  Router
} from '@angular/router';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { 
  combineLatest,
  Subscription 
} from 'rxjs';
import { 
  filter,
  first 
} from 'rxjs/operators';
import {
  CanComponentDeactivate,
  Candidate,
  MatcherService,
  ProjectedMapping,
  Question,
  SharedService,
  PATHS
} from '../../../core';
import {
  FLOATING_CARD_MAX_WIDTH_LANDSCAPE
} from '../../../components';
// import { 
//   MapEnsureVisibleOptions,
//   OnboardingTourComponent
// } from '../../../components';

const CARD_MIN_MARGIN: string = '1rem';
const CARD_MAX_WIDTH: string = '40rem';

type ListPlaceholder = {
  placeholderType: 'empty' | 'filterWarning' | 'noResults' | 'noCandidates' | 'intro';
}

/*
* <app-map>
*/
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.sass'],
  host: {
    '(click)': 'onBgClick()'
  },
})
export class ListComponent 
  implements AfterViewInit, DoCheck, OnInit, OnDestroy, CanComponentDeactivate {

  // @ViewChild(OnboardingTourComponent)
  // onboardingTour: OnboardingTourComponent;
  @ViewChild(CdkVirtualScrollViewport)
  virtualList: CdkVirtualScrollViewport;

  public activeCandidateId: string;
  public candidates = new Array<Candidate>();
  // For this and other below, Map would be nicer
  public disagreed: {
    [candidateId: string]: Question[]
  } = {};
  public cardWidth: string;
  public listOnRight: boolean = false;
  public itemHeight = "140px"; // This must match $itemHeight in the sass file
  public itemMargin = "16px";  // This must match $itemMargin in the sass file
  public marginLeft: string;
  public themes: {
    [candidateId: string]: string[]
  } = {};
  public voter: any; // We'll save the voter here

  private _doChanges: {
    activeCandidateId?: string
  } = {};
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];
  // Fire on afterViewInit
  private _viewInitialized = new EventEmitter<boolean>();
  // This is very hacky
  private _candidateOverlayOpen = false;


  constructor(
    private matcher: MatcherService,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService
  ) {

    // Check if we are browsing or not
    if (this.route.snapshot.data.voterDisabled)
      this.matcher.voterDisabled = true;
    else
      this.matcher.voterDisabled = false;

    this.shared.reportPageOpen({
      currentPage: this.voterDisabled ? 'browse-list' : 'list',
      // subtitle: (this.voterDisabled ?
      //             "Ehdokkaat on järjestetty sen mukaan, miten lähellä heidän mielipiteensä ovat vaalipiirin kaikkien ehdokkaiden keskiarvoa." :
      //             "Ehdokkaat on järjestetty sen mukaan, miten lähellä heidän mielipiteensä ovat sinun mielipiteitäsi."
      //           ),
      // onboarding: {restart: () => this.onboardingTour?.restart()},
      loadingState: {
        type: 'loading',
        message: $localize `Ladataan tuloksia…`,
      }
    });

    // Start loading spinner
    this._reportProgress();
  }

  get hasActiveFilters(): boolean {
    return this.matcher.hasActiveFilters;
  }

  /*
   * TODO: Remove this ugly trick!
   * We add an empty item to the start of the list to allow for
   * one empty item at the start of the virtual scroll list, as
   * setting the top margin for the first item causes glitches
   * with scrolling
   */
  get visibleCandidates(): Array<Candidate | ListPlaceholder> {
    // return [null].concat(this.candidates);

    const items: Array<Candidate | ListPlaceholder> = this.candidates.filter(c => !c.filteredOut);
    if (this.hasActiveFilters) {
      if (items.length === 0)
        items.unshift({placeholderType: 'noResults'});
      else
        items.unshift({placeholderType: 'filterWarning'});
    } else {
      if (items.length === 0)
        items.unshift({placeholderType: 'noCandidates'});
      else
        items.unshift({placeholderType: 'intro'});
    }
    items.unshift({placeholderType: 'empty'});
    return items;
  }

  get voterDisabled(): boolean {
    return this.matcher.voterDisabled;
  }

  ngOnInit() {
    this.listOnRight = false;
    // Initialisation chain
    this._subscriptions.push(this.matcher.progressChanged.subscribe(v => this._reportProgress(v)))
    this._subscriptions.push(this.matcher.candidateDataReady.subscribe(() => {
      // We might have no candidates if none have replied
      if (!this.matcher.hasCandidates)
        this.router.navigate([PATHS.constituencyPicker]);
      else
        this.initData();
    }));
    this._subscriptions.push(this.matcher.constituencyCookieRead.subscribe(() => {
      // Make sure the constituency is defined, as if not, candidateDataReady will never fire
      if (this.matcher.constituencyId == null)
        this.router.navigate([PATHS.constituencyPicker]);
    }));


    // Move list if we are using landscape mode and viewing a candidate
    this._subscriptions.push(this.shared.activeCandidateChanged.subscribe(() => {
      if (this.shared.activeCandidateId != null) this._candidateOverlayOpen = true;
      else setTimeout(() => this._candidateOverlayOpen = false, 100); // Hacky!!!
      this._doChanges.activeCandidateId = this.shared.activeCandidateId;
    }));

    // Scroll to top when filters are changed
    this._subscriptions.push(this.matcher.filterDataUpdated.subscribe(() => 
      setTimeout(() => this.scrollToTop(), 225)
    ));

    // Dynamic changes to margins cause bugs with scrolling

    // Move list if we are using landscape mode and viewing a candidate
    // this._subscriptions.push(this.shared.topBarExpansionChanged.subscribe(() => 
    //   this._updateMarginTop()
    // ));

    // Move list if we are using landscape mode and viewing a candidate
    // this._subscriptions.push(this.shared.ensureVisibleOnMap.subscribe(options => 
    //   this._updateMarginLeft(options)
    // ));

    // Set initial values
    this._updateMarginLeft();

  }

  /*
   * Process any changes here that might take place duting content checking
   */
  ngDoCheck() {
    if ('activeCandidateId' in this._doChanges) {
      this.activeCandidateId = this._doChanges.activeCandidateId;
      delete this._doChanges.activeCandidateId;
      this.listOnRight = true;
      this._updateMarginLeft();
    }
  }

  ngAfterViewInit() {
    // See sub in ngOnInit
    this._viewInitialized.emit(true);
  }

  ngOnDestroy() {
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
    this._subscriptions = null;
    this.candidates = null;
    this.voter = null;
    this._viewInitialized = null;
  }

  public canDeactivate(): boolean {
    // This is a very hacky way of cancelling navigation change when the candidate overlay is open
    // bc we can't read the activeCandidateId any more at this stage
    const deactivate = this._candidateOverlayOpen;
    this._candidateOverlayOpen = false;
    return !deactivate;
  }

  public onBgClick(): void {
    this.hideInfos();
    this.hideCandidate();
  }

  public getDisagreedQuestions(candidate: Candidate): Question[] {
    return this.matcher.getDisagreedQuestionsAsList(candidate, true);
  }

  public getPortraitUrl(candidate: Candidate): string {
    return this.matcher.getCandidatePortraitUrl(candidate);
  }

  public getThemes(candidate: Candidate): string[] {
    return candidate.getAnswer('electionTheme') ?? [];
  }

  public hideInfos(): void {
    this.shared.minimiseTopBar.emit();
  }

  public initData(): void {

    if (!this.matcher.hasEnoughAnswersForMapping &&
      !this.voterDisabled) {
      this.router.navigate([PATHS.questions]);
      return;
    }

    // We need to do this again, bc the voter's answers are not loaded when
    // the constructor is called if the page is reloaded
    this.shared.reportPageOpen({
      currentPage: this.voterDisabled ? 'browse-list' : 'list',
    });

    // Save session data unless we're browsing
    if (!this.voterDisabled)
      this.matcher.saveSessionStatistics();

    // When initMapping is called with a method, the projection is not applied to
    // the results as we don't want to override the calculated results for the map
    // FIX: We do override the projections by not specifyin 'Manhattan' as an arg
    // to initMapping
    // this.matcher.initMapping('Manhattan').then(result => this.initList(result));
    this.matcher.initMapping().then(result => this.initList(result));
  }

  public initList(result: {candidates: Candidate[], coordinates: ProjectedMapping}): void {

    // Get candidates
    this.candidates = new Array<Candidate>();

    // Sort indices by the first coordinate
    // And prefetch disagreed questions and themes for candidates
    // FIX: We could just order these by candidate.score
    const indices = [];
    for (let i = 0; i < result.candidates.length; i++) {
      indices.push(i);
      const c = result.candidates[i];
      this.disagreed[c.id] = this.getDisagreedQuestions(c);
      this.themes[c.id] = this.getThemes(c);
    }
    indices.sort((a, b) => result.coordinates[a][0] - result.coordinates[b][0]);

    // Add candidates in the sorted order
    for (let i of indices)
      this.candidates.push(result.candidates[i]);

    // Show list tools
    this.shared.showListTools = true;

    this._reportProgress(100, true);
  }

  public isFavourite(candidate: Candidate): boolean {
    return this.matcher.getFavourites().includes(candidate.id);
  }

  public openFilters(event?: Event): void {
    this.shared.showCandidateFilters.emit();
    event?.stopPropagation();
  }

  public scrollToTop(): void {
    this.virtualList?.scrollToIndex(0, 'smooth');
  }

  public openCandidateFilters(): void {
    this.shared.showCandidateFilters.emit();
  }

  public toggleCandidate(candidate: Candidate, event?: Event): void {

    if (this.shared.activeCandidateId !== candidate.id)
      this.shared.logEvent('list_show_candidate');
      
    this.shared.toggleCandidate.emit({
      id: candidate.id,
      maximise: true
    });
    this.hideInfos();
    event?.stopPropagation();
  }

  public hideCandidate(): void {
    this.shared.hideCandidate.emit();
  }

  public setFavourite(candidate: Candidate, add: boolean, event?: MouseEvent): void {
    if (add)
      this.matcher.addFavourite(candidate.id);
    else
      this.matcher.removeFavourite(candidate.id);
    // Disable floating card maximation
    event?.stopPropagation();
  }

  public returnHome(): void {
    this.router.navigate(['']);
  }

  private _reportProgress(value: number = null, complete = false) {
    if (complete || value >= 100)
      this.shared.loadingState.next({type: 'loaded'});
    else
      this.shared.loadingState.next({
        type: 'loading',
        message: $localize `Ladataan tuloksia…`,
        value
      })
  }

  // private _updateMarginLeft(options?: MapEnsureVisibleOptions): void {
  private _updateMarginLeft(options?: any): void {

    // Set initial values
    if (!options) {
      if (this.shared.usePortrait) {
        this.cardWidth = `calc(100vw - 2 * ${CARD_MIN_MARGIN})`;
        this.marginLeft = CARD_MIN_MARGIN;
      } else {
        this.cardWidth = `min(${CARD_MAX_WIDTH}, calc(100vw - 2 * ${CARD_MIN_MARGIN}))`;
        // `calc(100vw - 2 * ${CARD_MIN_MARGIN} - ${FLOATING_CARD_MAX_WIDTH_LANDSCAPE})`;
        this.marginLeft = this.listOnRight ? `calc(${FLOATING_CARD_MAX_WIDTH_LANDSCAPE} + ${CARD_MIN_MARGIN})` : `calc((100vw - ${this.cardWidth}) / 2)`;
      }
      return;
    }

    // If we use portrait mode, no changes are necessary
    if (this.shared.usePortrait)
      return;

    this.cardWidth = `min(${CARD_MAX_WIDTH}, calc(100vw - ${options.occluded.left + 3 + 10 + 3}px - ${CARD_MIN_MARGIN}))`;
    this.marginLeft = `calc(${options.occluded.left}px + ${CARD_MIN_MARGIN})`;
  }

}