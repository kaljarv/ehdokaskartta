import { Component, 
         ElementRef, 
         Input,
         ViewChild } from '@angular/core';

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
  selector: 'app-candidate-answer',
  templateUrl: './candidate-answer.component.html',
  styleUrls: ['./candidate-answer.component.sass'],
})
export class CandidateAnswerComponent {
  // The coloured background's height in pixels
  @Input() backgroundHeight: number = 24;
  @Input() questionText: string = null;
  // If topicText is specified, a chip with it (and styled with topicClass) is prepended to the title
  @Input() topicText: string = null;
  @Input() topicClass: string = null;
  // The label used next to the party flag
  @Input() candidateTitle: string = "Ehdokas";
  @Input() candidateAnswer: number = null;
  @Input() candidateAnswerOpen: string = null;
  @Input() voterAnswer: number = null;
  @Input() partyAnswer: number = null;
  @Input() partyName: string = '';
  @Input() partyTitle: string = "Puolue";
  @Input() showLegend: boolean = true;
  @Input() showMissingInfo: boolean = true;
  // We use this to reference the mask in the svg
  // Optimally this should be set by the user so as to be truly unique
  @Input() uniqueId: string = 'candidate-answer-uid-' + Math.round(Math.random() * 1E15);

  @ViewChild('svgContainer') svgContainer: ElementRef;

  public values: number[] = [1, 2, 3, 4, 5];

  constructor() {
  }

  get svgHeight(): number {
    return ANSWER_AVATAR_DIMENSIONS.midlineOffset + this.backgroundHeight / 2;
  }

  // We need to use a placeholder value as the svgContainer ElementRef is only initialized later
  get svgWidth(): number {
    return this.svgContainer ? this.svgContainer.nativeElement.clientWidth : 0;
  }

  // Invert voter answer for missing candidate answer or center if there's no value from the voter either
  get missingAnswer(): number {
    return this.voterAnswer != null ? (this.voterAnswer <= 3 ? 5 : 1) : 3;
  }

  // List of the values that are not used by either candidate or voter
  get unusedValues(): number[] {
    const inUse = new Set<number>();
    if (this.voterAnswer != null) {
      inUse.add(this.voterAnswer);
    }
    if (this.candidateAnswer != null) {
      inUse.add(this.candidateAnswer);
    } else {
      inUse.add(this.missingAnswer);
    }
    return this.values.filter( v => ! inUse.has(v) );
  }

  get maskId(): string {
    return this.uniqueId + '-mask';
  }

  get personsId(): string {
    return this.uniqueId + '-persons';
  }

  // Return the total y offset for an element of the given height
  public calcYOffset(elementHeight: number ): number {
    return ANSWER_AVATAR_DIMENSIONS.party.height - elementHeight;
  }

  // Y coordinate of the midline of the answer dots
  get centerlineY(): number {
    return ANSWER_AVATAR_DIMENSIONS.midlineOffset;
  }


  // Get x fraction [0..1] based value i [1..5]
  private _getX(i: number): number {
    return (0.2 * (i - 1) + 0.1);
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
    return  this.voterAnswer != null ?
              (this.candidateAnswer != null ?
                (this.voterAnswer == this.candidateAnswer ? 'agree' :
                  (Math.abs(this.voterAnswer - this.candidateAnswer) <= 1 ? 'mostlyAgree' : 'stronglyDisagree')) :
                'voterOnly') :
              (this.candidateAnswer != null ? 'candidateOnly' : 'none');
  }

  get showMissingAnswerInfo(): boolean {
    return this.showMissingInfo && this.candidateAnswer == null && this.voterAnswer != null;
  }
}
