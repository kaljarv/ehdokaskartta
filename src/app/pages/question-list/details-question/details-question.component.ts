import { 
  Component, 
  Inject,
  OnInit,
  ViewChild,
  QueryList,
  ElementRef,
  ViewEncapsulation
} from '@angular/core';

import { 
  MatBottomSheetRef, 
  MAT_BOTTOM_SHEET_DATA 
} from '@angular/material/bottom-sheet';

import {
  CdkDragDrop,
  moveItemInArray
} from '@angular/cdk/drag-drop';

import { 
  MatcherService,
  SharedService,
  Candidate,
  QuestionLikert,
  QuestionLikertSeven,
  QuestionNumeric,
  QuestionNumericValue,
  QuestionPreferenceOrder, 
  QuestionType,
  Question
} from '../../../core';

// Delay in ms before closing the bottom sheet after setting answer
export const CLOSE_DELAY: number = 450;

/* 
 * A utility class to publish styles to the global ns
 */
@Component({
  selector: 'app-details-question-global-styles',
  template: '',
  styleUrls: ['./details-question.global.sass'],
  encapsulation: ViewEncapsulation.None,
})
export class DetailsQuestionGlobalStylesComponent {
  constructor() {}
}


@Component({
  selector: 'app-details-question',
  templateUrl: './details-question.component.html',
  styleUrls: ['./details-question.component.sass']
})
export class DetailsQuestionComponent implements OnInit {

  @ViewChild('columns') columns: QueryList<ElementRef>;

  public question: QuestionNumeric;
  public candidates: {
    [value: number]: Candidate[]
  } = {};
  public showDeleteButton: boolean;
  public candidateSizingClass: string = 'candidateSize-medium';

  // For preference order data
  public preferenceOrder: QuestionNumericValue[];

  constructor(
    private bottomSheetRef: MatBottomSheetRef,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private matcher: MatcherService,
    private shared: SharedService,
  ) {
    // Get question object
    this.question = this.matcher.questions[data.id] as QuestionNumeric;

    // Init pref order
    if (this.questionType === 'PreferenceOrder')
      this._initPreferenceOrder();
      
    // Enable delete button if there's an answer
    // NB. We don't want to bind it dynamically, as then the button would be shown prematurely
    this.showDeleteButton = this.voterAnswer != null;
  }

  ngOnInit(): void {
    this._initDistributionChart();

    this.shared.logEvent('questions_show', {id: this.question.id, text: this.question.text});
  }

  /*
   * Make specific initialisations for preference order questions
   */
  private _initPreferenceOrder(): void {
    const q = this.question as QuestionPreferenceOrder;
    this.preferenceOrder = q.getVoterAnswerValues() || q.getShuffledValues();
  }

  private _initDistributionChart(): void {

    // Get Candidates for the distribution chart, group by party
    const candidates = this.matcher.getCandidatesAsList().sort(
      (a: Candidate, b: Candidate) => a.partyName.localeCompare(b.partyName)
    );

    // Sort Candidates per answer
    this.question.valueKeys.forEach(v => 
      this.candidates[v] = candidates.filter(c => Number(c.getAnswer(this.question)) == v)
    );

    // Set a special candidateSize class for extreme cases
    const factor = candidates.length * this.question.values.length / 5;
    // TODO: Enable on window resize
    if (window.innerWidth / factor < 15) {
      this.candidateSizingClass = 'candidateSize-small';
    } else if (window.innerWidth / factor > 75) {
      this.candidateSizingClass = 'candidateSize-large';
    }
    
  }

  dismiss(event: MouseEvent = null) {
    this.bottomSheetRef.dismiss();
    if (event != null) {
      event.preventDefault();
    }
  }

  openLink(event: MouseEvent): void {
    this.dismiss(event);
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

  get voterAnswer(): string | number[] {
    let a = this.question.voterAnswer;
    // We have to convert the answer to string for ngModel to work
    return a ? 
           (Array.isArray(a) ? a : a.toString()) : 
           undefined;
  }

  set voterAnswer(value: string | number[]) {
    this.matcher.setVoterAnswer(this.question, Array.isArray(value) ? value : Number(value));
    this.shared.logEvent('questions_answer', {id: this.question.id, text: this.question.text});
    setTimeout(() => this.dismiss(), CLOSE_DELAY);
  }

  public deleteVoterAnswer(): void {
    this.matcher.deleteVoterAnswer(this.question.id);
    this.shared.logEvent('questions_delete_answer', {id: this.question.id, text: this.question.text});
    setTimeout(() => this.dismiss(), CLOSE_DELAY);
  }

  get constituencyName(): string {
    return this.matcher.constituency || 'Vaalipiiri';
  }

  /*
   * For use with preference order questions
   */
  public drop(event: CdkDragDrop<QuestionNumericValue[]>) {
    moveItemInArray(this.preferenceOrder, event.previousIndex, event.currentIndex);
  }

  public savePreferenceOrder(): void {
    this.voterAnswer = this.preferenceOrder.map(v => v.key);
  }
}