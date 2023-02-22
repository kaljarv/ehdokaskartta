import { 
  AfterViewInit,
  Component, 
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { 
  trigger,
  style,
  state,
  animate,
  transition
} from '@angular/animations';
import { 
  MatBottomSheetRef, 
  MAT_BOTTOM_SHEET_DATA 
} from '@angular/material/bottom-sheet';

import { 
  ANIMATION_TIMING,
  ANIMATION_DURATION_MS,
  MatcherService,
  SharedService,
  Candidate,
  QuestionLikert,
  QuestionLikertSeven,
  QuestionNumeric,
  QuestionNumericValue,
  QuestionPreferenceOrder, 
  QuestionType
} from '../../../core';
// import { OnboardingTourComponent } from '../../../components';


// Delay in ms before closing the bottom sheet after setting answer
export const CLOSE_DELAY: number = 2 * ANIMATION_DURATION_MS;

/* 
 * A utility class to publish styles to the global ns
 */
@Component({
  selector: 'app-online-question-global-styles',
  template: '',
  styleUrls: ['./online-question.global.sass'],
  encapsulation: ViewEncapsulation.None,
})
export class OnlineQuestionGlobalStylesComponent {
  constructor() {}
}


@Component({
  selector: 'app-online-question',
  templateUrl: './online-question.component.html',
  styleUrls: ['./online-question.component.sass'],
  animations: [
    trigger('toggleExpand', [
      state('open', 
        style({
          height: '*',
          borderBottomColor: '*',
          paddingBottom: '*',
          paddingTop: '*',
        })),
      state('closed', 
        style({
          height: 0,
          borderBottomColor: 'rgba(255, 255, 255, 0.0)',
          paddingBottom: 0,
          paddingTop: 0,
        })),
      transition('* => *',
        animate(ANIMATION_TIMING)
      ),
    ]),
    trigger('toggleRotate', [
      state('normal', 
        style({
          transform: 'rotate(0deg)',
        })),
      state('rotated', 
        style({
          transform: 'rotate(-180deg)',
        })),
      transition('* => *',
        animate(ANIMATION_TIMING)
      ),
    ]),
  ]
})
export class OnlineQuestionComponent 
  implements AfterViewInit, OnDestroy, OnInit {

  @Input()  number: number;
  @Input()  totalNumber: number;
  @Input()  question: QuestionNumeric;
  @Output() onSkip = new EventEmitter<QuestionNumeric>();

  public additionalInfoExpanded: boolean = false;
  public candidates: {
    [value: number]: Candidate[]
  } = {};
  public candidateSizingClass: string = 'candidateSize-medium';
  // For preference order data
  public preferenceOrder: QuestionNumericValue[];
  public showDeleteButton: boolean;

  // Fire on afterViewInit
  private _viewInitialized = new EventEmitter<boolean>();

  constructor(
    private matcher: MatcherService,
    private shared: SharedService,
  ) {
    // Enable delete button if there's an answer
    // NB. We don't want to bind it dynamically, as then the button would be shown prematurely
    this.showDeleteButton = this.voterAnswer != null;
  }

  // get distributionChartExpanded(): boolean {
  //   return !this.shared.hideDistribution;
  // }

  ngOnInit(): void {
    // Onboarding
    // Show only after the bottom sheet is fully open and the view is initialized
    // First() will unsubscribe itself
    // combineLatest([this.bottomSheetRef.afterOpened(), this._viewInitialized]).pipe(
    //   first()
    // ).subscribe(() => {
    //   if (this.onboardingTour && !this.onboardingTour.active)
    //     this.onboardingTour.start();
    // });

    // this._initDistributionChart();

    this.shared.logEvent('questions_show', {id: this.question.id});
  }

  ngAfterViewInit(): void {
    this._viewInitialized.emit(true);
  }

  ngOnDestroy(): void {
    // We also do this in dismiss, but let's double check
    // this.onboardingTour?.complete();
    this.shared.reportOverlayClose();

    // this.columns = null;
    // this.onboardingTour = null;
    this.candidates = null;
    // this.preferenceOrder = null;
    this.question = null;
    this._viewInitialized = null;
  }

  dismiss(event?: Event) {
    this.onSkip.emit(this.question);
    if (event != null)
      event.stopPropagation();
  }

  openLink(event?: Event): void {
    this.dismiss(event);
  }

  radioClicked(event?: Event): void {
    setTimeout(() => this.dismiss(), CLOSE_DELAY);
  }

  skip(event?: Event): void {
    this.matcher.setSkippedByVoter(this.question, true);
    this.shared.logEvent('questions_skip', {id: this.question.id});
    setTimeout(() => this.dismiss(event), CLOSE_DELAY);
  }

  get questionType(): QuestionType {
    if (this.question instanceof QuestionLikert)
      return 'Likert';
    if (this.question instanceof QuestionLikertSeven)
      return 'Likert7';
    if (this.question instanceof QuestionPreferenceOrder)
      return 'PreferenceOrder';
    throw new Error(`Unimplemented question type '${this.question.constructor.name}'!`);
  }

  get useMunicipalityAsConstituency(): boolean {
    return this.matcher.config.useMunicipalityAsConstituency;
  }

  get voterAnswer(): string | number[] {
    let a = this.question?.voterAnswer;
    // We have to convert the answer to string for ngModel to work
    return a ? 
           (Array.isArray(a) ? a : a.toString()) : 
           undefined;
  }

  set voterAnswer(value: string | number[]) {
    this.matcher.setVoterAnswer(this.question, Array.isArray(value) ? value : Number(value));
    this.shared.logEvent('questions_answer', {id: this.question.id});
    // setTimeout(() => this.dismiss(), CLOSE_DELAY);
  }

  public deleteVoterAnswer(): void {
    this.matcher.deleteVoterAnswer(this.question.id);
    this.shared.logEvent('questions_delete_answer', {id: this.question.id});
    setTimeout(() => this.dismiss(), CLOSE_DELAY);
  }

  get constituencyName(): string {
    return this.matcher.constituency || 'Vaalipiiri';
  }

  /*
   * For use with preference order questions
   */
  // public drop(event: CdkDragDrop<QuestionNumericValue[]>) {
  //   moveItemInArray(this.preferenceOrder, event.previousIndex, event.currentIndex);
  // }

  // public savePreferenceOrder(): void {
  //   this.voterAnswer = this.preferenceOrder.map(v => v.key);
  // }

  /*
   * Hide or show additional info
   */
  public toggleAdditionalInfo(event?: Event): void {
    this.additionalInfoExpanded = !this.additionalInfoExpanded;
    if (this.additionalInfoExpanded)
      this.shared.logEvent('questions_show_additional_info');
    event?.preventDefault();
  }

  /*
   * Hide or show distribution chart
   */
  // public toggleDistributionChart(event?: Event): void {
  //   this.shared.hideDistribution = !this.shared.hideDistribution;
  //   this.shared.logEvent(this.shared.hideDistribution ? 'questions_hide_distribution' : 'questions_show_distribution');
  //   event?.preventDefault();
  // }
}