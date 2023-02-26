import { AfterViewInit,
         ElementRef,
         Component, 
         OnDestroy,
         OnInit,
         QueryList,
         ViewChildren,
         ViewEncapsulation } from '@angular/core';
import { trigger,
         style,
         animate,
         transition } from '@angular/animations';
import { ActivatedRoute,
         Router } from '@angular/router';
import { pipe, 
         Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { MatcherService,
         QuestionNumeric,
         SharedService, 
         ANIMATION_DURATION_MS,
         ANIMATION_TIMING,
         PATHS } from '../../core';
// import { OnboardingTourComponent } from '../../components';

import { QuestionListTopBarContentComponent } from './question-list-top-bar-content.component';
import { OnlineQuestionComponent } from './online-question';

// Delays for the star to appear and disappear, needed because of delay in closing the question bottom sheet
const ANIMATION_ENTER_DELAY = '1000ms';
const ANIMATION_EXIT_DELAY = '900ms';

@Component({
  selector: 'app-online-question-list',
  templateUrl: './online-question-list.component.html',
  styleUrls: ['./online-question-list.component.sass'],
  // We need to control .mat-chip-list-wrapper
  // encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('buttonAppear', [
      transition(':enter', [
        style({
          transform: 'scale(0)'
        }),
        animate(ANIMATION_TIMING, style({
          transform: 'scale(1)'
        })),
      ], {
        params: {
          delay: ANIMATION_ENTER_DELAY
      }}),
      transition(':leave', [
        style({
          transform: 'scale(1)'
        }),
        animate(ANIMATION_TIMING, style({
          transform: 'scale(0)'
        }))
      ], {
        params: {
          delay: ANIMATION_EXIT_DELAY
      }}),
    ])
  ],
  // Minimise the top bar when first clicking on background
  host: {
    "(click)": "hideInfos()"
  },
})
export class OnlineQuestionListComponent
  implements AfterViewInit, OnDestroy, OnInit {

  @ViewChildren(OnlineQuestionComponent)
  questionComponents: QueryList<OnlineQuestionComponent>;

  public paths = PATHS;
  public questions: QuestionNumeric[] = [];
  public questionsInitialized: boolean = false;

  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];
  // Track first interaction
  private _userHasClicked: boolean = false;
  // Fire on afterViewInit
  // private _viewInitialized = new EventEmitter<boolean>();

  constructor(
    private container: ElementRef<HTMLElement>,
    private matcher: MatcherService,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
  ) { 

    this.shared.reportPageOpen({
      currentPage: 'questions',
      subtitle: QuestionListTopBarContentComponent,
      // onboarding: {restart: () => this.onboardingTour?.restart()},
      loadingState: {
        type: 'loading',
        message: $localize `Ladataan kysymyksiä…`
      }
    });
  }

  get showParticipationWarning(): boolean {
    return this.matcher.hasLowParticiation;
  }

  get totalCandidates(): number {
    return this.matcher.totalCandidates ?? 0;
  }

  ngOnInit() {
    this._subscriptions.push(this.matcher.candidateDataReady.subscribe(() => {
      // We might have no candidates if none have replied
      if (!this.matcher.hasCandidates)
        this.router.navigate([PATHS.error], {state: {
          icon: 'sentiment_very_dissatisfied',
          title: $localize `Valitettavasti yksikään vaalipiirin ${this.matcher.constituency} ehdokkaista ei ole vastannut Kielivaalikoneen kysymyksiin`
        }});
    }));
    // questionData includes voter answers
    // this._subscriptions.push(this.matcher.questionDataUpdated.subscribe(() =>  this._updateData()));
    this._subscriptions.push(this.matcher.questionDataReady.pipe(take(1)).subscribe(() => {
      this._fetchQuestions();
    }));
    this._subscriptions.push(this.matcher.constituencyCookieRead.pipe(take(1)).subscribe(() => {
      // Make sure the constituency is defined, as if not, questionDataReady will never fire
      if (this.matcher.constituencyId == null)
        this.router.navigate([PATHS.constituencyPicker]);
    }));
    this._subscriptions.push(this.route.fragment.subscribe(() => this._scrollToCurrentQuestion()));
    // Show onboarding only after data is loaded and the view is initialized
    // First() will unsubscribe itself
    // combineLatest([this.shared.loadingState, this._viewInitialized]).pipe(
    //   filter(([ls, _]) => ls.type === 'loaded'),
    //   first()
    // ).subscribe(() => {
    //   if (this.onboardingTour && !this.onboardingTour.active)
    //     this.onboardingTour.start();
    // });
  }

  ngAfterViewInit() {
    this._scrollToCurrentQuestion();
  //   // Need to check it here as the subscriptions won't catch reading data from cookie, which happens at matcher service initialization
  //   this._checkEnableForward();
  //   // See subs above
  //   // this._viewInitialized.emit(true);
  }

  ngOnDestroy() {
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
    this._subscriptions = null;

    // this.onboardingTour = null;
    // this.onboardingTourEnoughAnswers = null;
    this.questions = null;
    // this._viewInitialized = null;
  }

  /*
   * Minimise the top bar when first clicking on a question
   * We do this only once, as we don't want the top bar to minimise if the user has later explicitly opened it
   */
  public hideInfos(): void {
    if (!this._userHasClicked) {
      this._userHasClicked = true;
      this.shared.minimiseTopBar.emit();
    }
  }

  public goToNextQuestion(currentQuestion: QuestionNumeric): void {
    let found = false;
    for (const q of this.questionComponents) {
      if (found) {
        this.router.navigate([], {fragment: q.question.id});
        found = false;
        break;
      }
      if (q.question === currentQuestion) found = true;
    }
    // This was the last question
    if (found)
      this.goToResults();
  }

  public goToResults(): void {
    this.shared.navigateForward.emit({path: [PATHS.list]})
  }

  private _scrollToCurrentQuestion(): void {
    const id = this.route.snapshot.fragment;
    if (id != null && id != '')
      this._scrollIntoView(id);
  }

  private _scrollIntoView(id: string): void {
    // Get scroll container
    const containerEl = this.container?.nativeElement.parentElement;
    if (!containerEl) return;
    // Get element to scroll to
    const element = containerEl.querySelector(`#${id}`) as HTMLElement;
    if (!element) return;
    // We'll change scroll-behavior to smooth, so we'll need to save the old one
    const oldBehavior = containerEl.style.scrollBehavior;
    containerEl.style.scrollBehavior = 'smooth';
    // Scroll
    containerEl.scrollTop = element.offsetTop;
    // Revert scroll-behavior
    containerEl.style.scrollBehavior = oldBehavior;
  }

  private _fetchQuestions(): void {
    // this._updateInformationValues();
    this.questions = this.matcher.getAnswerableQuestions(true);
    this.questionsInitialized = true;
    this.shared.loadingState.next({ type: 'loaded' });
    this._scrollToCurrentQuestion();
  }

}