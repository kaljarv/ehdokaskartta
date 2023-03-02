import { 
  Component, 
  Input,
  OnDestroy
} from '@angular/core';

import {
  QuestionLikert,
  QuestionLikertSeven,
  QuestionNumeric,
  QuestionPreferenceOrder,
  QuestionType
} from '../../../core';


@Component({
  selector: 'app-candidate-answer',
  templateUrl: './candidate-answer.component.html',
  styleUrls: ['./candidate-answer.component.sass'],
})
export class CandidateAnswerComponent
  implements OnDestroy {

  @Input() question: QuestionNumeric ;
  // The label used next to the party flag
  @Input() candidateTitle: string = $localize `Ehdokas`;
  @Input() candidateAnswer: number | number[] = null;
  @Input() candidateAnswerOpen: string = null;
  @Input() voterAnswer: number | number[] = null;
  @Input() partyAnswer: number | number[] = null;
  @Input() partyName: string = '';
  @Input() partyId: string = '';
  @Input() partyAbbreviation: string = '';
  @Input() partyTitle: string = $localize `Puolue`;
  @Input() showMissingInfo: boolean = true;

  constructor() {
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

  get showMissingAnswerInfo(): boolean {
    return this.showMissingInfo && this.candidateAnswer == null && this.voterAnswer != null;
  }

  ngOnDestroy(): void {
    this.question = null;
  }
}
