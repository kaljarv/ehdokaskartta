import { 
  Component, 
  DoCheck,
  ElementRef, 
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';

import {
  AgreementType,
  QuestionLikert
} from '../../../core';

export const ANSWER_AVATAR_DIMENSIONS = {
  // The y offset of the value midline from the top of the party element
  midlineOffset: 57.5327,
  // The x distance between the voter and the candidate when they have the same answer
  coincidentOffset: 18.7171,
  voter: {
    width: 26.2649,
    height: 67.8839,
  },
  candidate: {
    width: 26.2652,
    height: 76.4394,
  },
  missing: {
    width: 15.8511,
    height: 31.878,
    bottomOffset: 36.4688,
  },
  party: {
    width: 26.4251,
    height: 98.1763,
    rootX: 3.5389 / 2,
  }
};

@Component({
  selector: 'app-likert-answer',
  templateUrl: './likert-answer.component.html',
  styleUrls: ['./likert-answer.component.sass'],
})
export class LikertAnswerComponent 
  implements DoCheck, OnDestroy {

  // The coloured background's height in pixels
  @Input() backgroundHeight: number = 24;
  @Input() question: QuestionLikert;
  // The label used next to the party flag
  @Input() candidateTitle: string = $localize `Ehdokas`;
  @Input() candidateAnswer: number;
  @Input() voterAnswer: number;
  @Input() partyAnswer: number;
  @Input() partyName: string = '';
  @Input() partyTitle: string = $localize `Puolue`;
  @Input() showValueLabels: boolean = true;
  // We use this to reference the mask in the svg
  // Optimally this should be set by the user so as to be truly unique
  @Input() uniqueId: string = 'candidate-answer-uid-' + Math.round(Math.random() * 1E15);

  @ViewChild('svgContainer') svgContainer: ElementRef;

  /*
   * We'll set this once the svg container has been initialized
   */
  public svgWidth: number = 0;

  constructor() {}
  
  /*
   * Update svgWidth here. We can't use the other loops because that would result in value
   * changed after checked errors.
   * TODO: Allow this also on resize
   */
  ngDoCheck() {
    if (this.svgWidth === 0 && this.svgContainer && this.svgContainer.nativeElement.clientWidth > 0)
      this.svgWidth = this.svgContainer.nativeElement.clientWidth;
  }

  ngOnDestroy() {
    this.question = null;
    this.svgContainer = null;
  }

  // Invert voter answer for missing candidate answer or center if there's no value from the voter either
  get missingAnswer(): number {
    return this.voterAnswer != null ? 
           this.question.getInvertedVoterAnswer() : 
           this.question.neutralAnswer;
  }

  // List of the values that are not used by either candidate or voter
  get unusedValues(): number[] {
    const inUse = new Set<number>();
    if (this.voterAnswer != null)
      inUse.add(this.voterAnswer);
    if (this.candidateAnswer != null)
      inUse.add(this.candidateAnswer);
    else
      inUse.add(this.missingAnswer);
    return this.question.values.map(v => v.key).filter(k => ! inUse.has(k));
  }

  get maskId(): string {
    return this.uniqueId + '-mask';
  }

  get personsId(): string {
    return this.uniqueId + '-persons';
  }

  get maxElementHeight(): number {
    const element = this.partyAnswer != null ? 'party' : 
                    this.candidateAnswer != null ? 'candidate' :
                    'voter';
    return ANSWER_AVATAR_DIMENSIONS[element].height;
  }

  // Return the total y offset for an element of the given height
  public calcYOffset(elementHeight: number ): number {
    return this.maxElementHeight - elementHeight;
  }

  // Y coordinate of the midline of the answer dots
  get centerlineY(): number {
    return ANSWER_AVATAR_DIMENSIONS.midlineOffset - ANSWER_AVATAR_DIMENSIONS.party.height + this.maxElementHeight;
  }

  get svgHeight(): number {
    return this.centerlineY + this.backgroundHeight / 2;
  }

  // Get x fraction [0..1] based on value key and with even spacing
  private _getX(i: number): number {
    // In theory this allows for ranges of, e.g., 3 to 7, thus -minAnswer + 1
    const range = this.question.maxAnswer - this.question.minAnswer + 1;
    return (1 / range) * (i - this.question.minAnswer + 0.5);
  }

  // Get percentage based x position for an answer value
  public getX(i: number, modifier: number = 0): string {
    return (this._getX(i) * 100 + modifier) + '%';
  }

  // Get absolute unitless x position for an answer value
  // NB. Modifier should be a fraction [0..1]
  public getAbsX(i: number, modifier: number = 0): number {
    return this.svgWidth * (this._getX(i) + modifier);
  }

  // Center horisontally within the container and set appropriate y offset from svg top
  get partyInnerAlignment(): string {
    return `translate(-${ANSWER_AVATAR_DIMENSIONS.party.rootX}, ${this.calcYOffset(ANSWER_AVATAR_DIMENSIONS.party.height)})`;
  }

  // Center horisontally within the container and set appropriate y offset from svg top
  get candidateInnerAlignment(): string {
    let x = -1 * ANSWER_AVATAR_DIMENSIONS.candidate.width / 2;
    // If the voter and candidate have the same answer, offset them from each other a bit
    if (this.matchType === 'agree')
      x += ANSWER_AVATAR_DIMENSIONS.coincidentOffset / 2;
    return `translate(${x}, ${this.calcYOffset(ANSWER_AVATAR_DIMENSIONS.candidate.height)})`;
  }

  // Center horisontally within the container and set appropriate y offset from svg top
  get missingInnerAlignment(): string {
    return `translate(-${ANSWER_AVATAR_DIMENSIONS.missing.width / 2}, ${this.calcYOffset(ANSWER_AVATAR_DIMENSIONS.missing.height + ANSWER_AVATAR_DIMENSIONS.missing.bottomOffset)})`;
  }

  // Center horisontally within the container and set appropriate y offset from svg top
  get voterInnerAlignment(): string {
    let x = -1 * ANSWER_AVATAR_DIMENSIONS.voter.width / 2;
    // If the voter and candidate have the same answer, offset them from each other a bit
    if (this.matchType === 'agree')
      x -= ANSWER_AVATAR_DIMENSIONS.coincidentOffset / 2;
    return `translate(${x}, ${this.calcYOffset(ANSWER_AVATAR_DIMENSIONS.voter.height)})`;
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
