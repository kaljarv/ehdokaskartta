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
  Router
} from '@angular/router';
import { 
  combineLatest,
  Subscription 
} from 'rxjs';
import { 
  filter,
  first 
} from 'rxjs/operators';
import {
  Candidate,
  MatcherService,
  ProjectedMapping,
  Question,
  SharedService,
  PATHS
} from '../../../core';
import { 
  MapEnsureVisibleOptions,
  OnboardingTourComponent
} from '../../../components';

const CARD_MIN_MARGIN: string = '1rem';
const CARD_MAX_WIDTH: string = '40rem';

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
  implements AfterViewInit, DoCheck, OnInit, OnDestroy {

  @ViewChild(OnboardingTourComponent)
  onboardingTour: OnboardingTourComponent;

  public activeCandidateId: string;
  public candidates = new Array<Candidate>();
  public disagreed: {
    [candidateId: string]: Question[]
  } = {};
  public cardWidth: string;
  public marginLeft: string;
  public voter: any; // We'll save the voter here

  private _doChanges: {
    activeCandidateId?: string
  } = {};
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];
  // Fire on afterViewInit
  private _viewInitialized = new EventEmitter<boolean>();


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
      subtitle: (this.voterDisabled ?
                  "Ehdokkaat on järjestetty sen mukaan, miten lähellä heidän mielipiteensä ovat vaalipiirin kaikkien ehdokkaiden keskiarvoa." :
                  "Ehdokkaat on järjestetty sen mukaan, miten lähellä heidän mielipiteensä ovat sinun mielipiteitäsi."
                ),
      onboarding: {restart: () => this.onboardingTour?.restart()},
      loadingState: {
        type: 'loading',
        message: 'Ladataan tuloksia…',
      }
    });

    // Start loading spinner
    this._reportProgress();
  }

  get partyFiltersActive(): boolean {
    return this.matcher.hasPartyFilter;
  }

  /*
   * TODO: Remove this ugly trick!
   * We add an empty item to the start of the list to allow for
   * one empty item at the start of the virtual scroll list, as
   * setting the top margin for the first item causes glitches
   * with scrolling
   */
  get visibleCandidates(): Candidate[] {
    return [null].concat(this.candidates);
    // return [null].concat(this.candidates.filter(c => !c.filteredOut));
  }

  get voterDisabled(): boolean {
    return this.matcher.voterDisabled;
  }

  ngOnInit() {

    // Initialisation chain
    this._subscriptions.push(this.matcher.progressChanged.subscribe(v => this._reportProgress(v)))
    this._subscriptions.push(this.matcher.candidateDataReady.subscribe(() => this.initData()));
    this._subscriptions.push(this.matcher.constituencyCookieRead.subscribe(() => {
      // Make sure the constituency is defined, as if not, candidateDataReady will never fire
      if (this.matcher.constituencyId == null)
        this.router.navigate([PATHS.constituencyPicker]);
    }));

    // Onboarding
    // Show only after data is loaded and the view is initialized
    // First() will unsubscribe itself
    combineLatest([this.shared.loadingState, this._viewInitialized]).pipe(
      filter(([ls, _]) => ls.type === 'loaded'),
      first()
    ).subscribe(() => {
      if (this.onboardingTour && !this.onboardingTour.active)
        // We need a timeout to make sure the topTools div is rendered
        setTimeout(() => this.onboardingTour.start(), 225);
    });

    // Move list if we are using landscape mode and viewing a candidate
    this._subscriptions.push(this.shared.activeCandidateChanged.subscribe(() => 
      this._doChanges.activeCandidateId = this.shared.activeCandidateId
    ));

    // Dynamic changes to margins cause bugs with scrolling

    // Move list if we are using landscape mode and viewing a candidate
    // this._subscriptions.push(this.shared.topBarExpansionChanged.subscribe(() => 
    //   this._updateMarginTop()
    // ));

    // Move list if we are using landscape mode and viewing a candidate
    this._subscriptions.push(this.shared.ensureVisibleOnMap.subscribe(options => 
      this._updateMarginLeft(options)
    ));

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

  public onBgClick(): void {
    this.hideInfos();
    this.hideCandidate();
  }

  public getDisagreedQuestions(candidate: Candidate): Question[] {
    return this.matcher.getDisagreedQuestionsAsList(candidate, true);
  }

  public getPortraitUrl(candidate: Candidate): string {
    return this.matcher.getCandidatePortraitUrl(candidate.id);
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

    // When initMapping is called with a method, the projection is not applied to
    // the results as we don't want to override the calculated results for the map
    this.matcher.initMapping('Manhattan').then(result => this.initList(result));
  }

  public initList(result: {candidates: Candidate[], coordinates: ProjectedMapping}): void {

    // Get candidates
    this.candidates = new Array<Candidate>();

    // Sort indices by the first coordinate
    const indices = [];
    for (let i = 0; i < result.candidates.length; i++)
      indices.push(i);
    indices.sort((a, b) => result.coordinates[a][0] - result.coordinates[b][0]);

    // Add candidates in the sorted order
    for (let i of indices)
      this.candidates.push(result.candidates[i]);

    // Prefetch disagreed questions for candidates
    for (let c of this.candidates)
      this.disagreed[c.id] = this.getDisagreedQuestions(c);

    // Show list tools
    this.shared.showListTools = true;

    this._reportProgress(100, true);
  }

  public isFavourite(candidate: Candidate): boolean {
    return this.matcher.getFavourites().includes(candidate.id);
  }


  public toggleCandidate(candidate: Candidate, event?: Event): void {
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

  private _reportProgress(value: number = null, complete = false) {
    if (complete || value >= 100)
      this.shared.loadingState.next({type: 'loaded'});
    else
      this.shared.loadingState.next({
        type: 'loading',
        message: 'Ladataan tuloksia…',
        value
      })
  }

  private _updateMarginLeft(options?: MapEnsureVisibleOptions): void {

    // Set initial values
    if (!options) {
      if (this.shared.usePortrait) {
        this.cardWidth = `calc(100vw - 2 * ${CARD_MIN_MARGIN})`;
        this.marginLeft = CARD_MIN_MARGIN;
      } else {
        this.cardWidth = `min(${CARD_MAX_WIDTH}, calc(100vw - 2 * ${CARD_MIN_MARGIN}))`;
        // `calc(100vw - 2 * ${CARD_MIN_MARGIN} - ${FLOATING_CARD_MAX_WIDTH_LANDSCAPE})`;
        this.marginLeft = `calc((100vw - ${this.cardWidth}) / 2)`;
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