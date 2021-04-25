import { Component, 
         OnInit,
         AfterViewInit,
         OnDestroy,
         ViewEncapsulation } from '@angular/core';
import { trigger,
         style,
         animate,
         transition } from '@angular/animations';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { MatcherService,
         QuestionNumeric,
         SharedService, 
         ANIMATION_TIMING,
         PATHS } from '../../core';

import { QuestionListTopBarContentComponent } from './question-list-top-bar-content.component';

// Delays for the star to appear and disappear, needed because of delay in closing the question bottom sheet
const ANIMATION_ENTER_DELAY = '1000ms';
const ANIMATION_EXIT_DELAY = '900ms';

@Component({
  selector: 'app-question-list',
  templateUrl: './question-list.component.html',
  styleUrls: ['./question-list.component.sass'],
  // We need to control .mat-chip-list-wrapper
  encapsulation: ViewEncapsulation.None,
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
export class QuestionListComponent
  implements OnInit, AfterViewInit, OnDestroy {

  public questions: QuestionNumeric[];
  public informationValueOrder: {id: string, value: number }[];

  private _contentChecked: boolean = false;
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];
  // Track first interaction
  private _userHasClicked: boolean = false;

  constructor(
    private matcher: MatcherService,
    private router: Router,
    private shared: SharedService
  ) { 
    this.shared.loadingState.next({
      type: 'loading',
      message: 'Ladataan kysymyksiä…'
    });
    this.shared.titleIndex = 1;
    this.shared.subtitle = QuestionListTopBarContentComponent;
  }

  ngOnInit() {
    // questionData includes voter answers
    this._subscriptions.push(this.matcher.questionDataUpdated.subscribe(() =>  this._updateData()));
    this._subscriptions.push(this.matcher.questionDataReady.subscribe(() => this._fetchQuestions()));
    this._subscriptions.push(this.matcher.constituencyCookieRead.subscribe(() => {
      // Make sure the constituency is defined, as if not, questionDataReady will never fire
      if (this.matcher.constituencyId == null)
        this.router.navigate([PATHS.constituencyPicker]);
    }));
  }

  ngAfterViewInit() {
    // Need to check it here as the subscriptions won't catch reading data from cookie, which happens at matcher service initialization
    this._checkEnableForward();
  }

  ngOnDestroy() {
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
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

  public showQuestion(question: QuestionNumeric): void {
    this.shared.showQuestion.emit(question.id);
    this.hideInfos();
  }

  /*
   * Check if this is the next recommend question. This is based crudely as the first question in the order
   */
  public isRecommended(question: QuestionNumeric): boolean {
    return this.informationValueOrder && this.informationValueOrder.length && 
           this.informationValueOrder[0].id === question.id;
  }

  private _fetchQuestions(): void {
    this._updateInformationValues();
    this.questions = this.matcher.getAnswerableQuestions();
    this.shared.loadingState.next({ type: 'loaded' });
  }

  private _updateData(): void {
    this._updateInformationValues();
    this._checkEnableForward();
  }

  private _updateInformationValues(): void {
    this.informationValueOrder = this.matcher.getInformationValueOrder();
    this.shared.forwardProgress.emit(this.matcher.getTotalInformation() * 100);
  }

  private _checkEnableForward(): void {
    if (this.matcher.hasEnoughAnswersForMapping) {
      this.shared.enableForward.emit({
        path: [PATHS.map],
        title: 'Näytä tulokset',
        progressTitle: 'Tuloskartan tarkkuus',
        showProgress: true,
      });
    } else {
      this.shared.disableForward.emit();
    }
  }
}