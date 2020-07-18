import { Component, 
         Inject,
         OnInit,
         AfterViewChecked,
         ViewChild,
         QueryList,
         ElementRef,
         ViewEncapsulation } from '@angular/core';

import { MatBottomSheetRef, 
         MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { MatcherService,
         SharedService,
         Candidate,
         Question } from '../../../core';

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
export class DetailsQuestionComponent
  implements OnInit,
             AfterViewChecked {

  @ViewChild('columns') columns: QueryList<ElementRef>;
  
  public questionId: string;
  public question: Question;
  public values: number[] = [1, 2, 3, 4, 5];
  public candidates: {
      [value: number]: Candidate[]
    } = {};
  public showDeleteButton: boolean;
  public candidateSizingClass: string = 'candidateSize-medium';

  constructor(
    private bottomSheetRef: MatBottomSheetRef,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private matcher: MatcherService,
    private shared: SharedService,
  ) {
    this.questionId = data.id;
  }

  ngOnInit(): void {

    // Get Question object
    this.question = this.matcher.getQuestion(this.questionId);

    // Enable delete button if there's an answer
    // NB. We don't want to bind it dynamically, as then the button would be shown prematurely
    this.showDeleteButton = this.voterAnswer != null;

    // Get Candidates for the distribution chart, group by party
    const candidates = this.matcher.getCandidatesAsList().sort( (a, b) => a.party.localeCompare(b.party) );

    // Sort Candidates per answer
    let columnMax = 0;
    this.values.forEach( v => {
      this.candidates[v] = candidates.filter( c => Number(c[this.question.id]) == v );
      // Save the highest number in a column for radius calculation
      if (this.candidates[v].length > columnMax)
        columnMax = this.candidates[v].length;
    });

    // Set a special candidateSize class for extreme cases
    // TODO: Enable on window resize
    if (window.innerWidth / columnMax < 3) {
      this.candidateSizingClass = 'candidateSize-small';
    } else if (window.innerWidth / columnMax > 15) {
      this.candidateSizingClass = 'candidateSize-large';
    }

    this.shared.logEvent('questions_show', {id: this.questionId, text: this.question.text});
  }

  ngAfterViewChecked(): void {
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

  get voterAnswer(): string {
    let a = this.matcher.getVoterAnswer(this.question.id);
    // We have to convert the answer to string for ngModel to work
    return a ? a + '' : null;
  }
  set voterAnswer(value: string) {
    this.matcher.setVoterAnswer(this.question.id, Number(value));
    this.shared.logEvent('questions_answer', {id: this.questionId, text: this.question.text});
    setTimeout(() => this.dismiss(), CLOSE_DELAY);
  }

  public deleteVoterAnswer(): void {
    this.matcher.deleteVoterAnswer(this.question.id);
    this.shared.logEvent('questions_delete_answer', {id: this.questionId, text: this.question.text});
    setTimeout(() => this.dismiss(), CLOSE_DELAY);
  }

  public getTooltip(candidate: Candidate): string {
    return `${candidate.givenName}\xa0${candidate.surname}, ${candidate.party}`;
  }

  get constituencyName(): string {
    return this.matcher.constituency ? this.matcher.constituency : 'Vaalipiiri';
  }
}