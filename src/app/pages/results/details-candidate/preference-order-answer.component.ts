import { 
  Component, 
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  AgreementType,
  MatcherService,
  QuestionNumeric,
  QuestionNumericValue,
  QuestionPreferenceOrder,
} from '../../../core';

import {
  ANSWER_AVATAR_DIMENSIONS
} from './likert-answer.component';

/*
 * OrderIndex is the index for the option in voter's preferences
 * or the index itself if voter hasnt' answered
 */
type PreferenceValue = {
  key: number,
  name?: string,
  orderIndex: number
}

@Component({
  selector: 'app-preference-order-answer',
  templateUrl: './preference-order-answer.component.html',
  styleUrls: ['./preference-order-answer.component.sass'],
})
export class PreferenceOrderAnswerComponent 
  implements OnDestroy, OnInit {

  @Input() avatarHeight: number = 47;
  @Input() question: QuestionPreferenceOrder;
  // The label used next to the party flag
  @Input() candidateTitle: string = "Ehdokas";
  @Input() candidateAnswer: number[];
  @Input() voterAnswer: number[];
  @Input() partyAnswer: number[];
  @Input() partyName: string = '';
  @Input() partyTitle: string = "Puolue";

  public candidatePreferences: PreferenceValue[];
  public voterPreferences: PreferenceValue[];

  constructor(
    private matcher: MatcherService,
  ) {}

  ngOnInit() {
    // Populate voter and candidate preferences adding orderIndeces
    if (this.voterAnswer)
      this.voterPreferences = this.voterAnswer.map((k, i) => ({orderIndex: i, ...this.question.getValue(k)}));
    if (this.candidateAnswer)
      this.candidatePreferences = this.candidateAnswer.map((k, i) => {
        const value = this.question.getValue(k);
        let orderIndex = i;
        if (this.voterAnswer)
          for (const p of this.voterPreferences)
            if (p.key == value.key) {
              orderIndex = p.orderIndex;
              break;
            }
        return {orderIndex, ...value}
      }); 
  }

  ngOnDestroy() {
    this.question = null;
    this.candidatePreferences = null;
    this.voterPreferences = null;
  }

  get svgWidth(): number {
    return ANSWER_AVATAR_DIMENSIONS.candidate.width;
  }

  get voterYOffset(): number {
    return ANSWER_AVATAR_DIMENSIONS.candidate.height - ANSWER_AVATAR_DIMENSIONS.voter.height;
  }

  // Invert voter answer for missing candidate answer or center if there's no value from the voter either
  get missingAnswer(): number[] {
    return this.voterAnswer != null ? 
           this.question.getInvertedVoterAnswer() : 
           this.question.neutralAnswer;
  }

  get matchType(): string {
    if (this.voterAnswer == null && this.candidateAnswer == null)
      return 'none';
    if (this.voterAnswer == null)
      return 'candidateOnly';
    switch(this.question.match(this.voterAnswer, this.candidateAnswer, false)) {
      case AgreementType.FullyAgree:
        return 'agree';
      case AgreementType.SomewhatDisagree:
        return 'mostlyAgree';
      case AgreementType.StronglyDisagree:
        return 'stronglyDisagree';
    }
    throw new Error(`Error with matching question '${this.question.id}'!`);
  }

}
