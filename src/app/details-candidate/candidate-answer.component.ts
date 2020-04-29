import { Component, 
         Input, 
         OnInit 
       } from '@angular/core';

import { Question } from '../core/matcher.service';

@Component({
  selector: 'app-candidate-answer',
  templateUrl: './candidate-answer.component.html'
})
export class CandidateAnswerComponent implements OnInit {
  @Input() question: Question = null;
  @Input() id: string = null;
  @Input() text: string = null;
  @Input() topic: string = null;
  @Input() category: string = null;
  @Input() candidateTitle: string = "Ehdokas";
  @Input() candidateAnswer: number = null;
  @Input() candidateAnswerOpen: string = null;
  @Input() voterAnswer: number = null;
  @Input() partyAnswer: number = null;
  @Input() partyTitle: string = "Puolue";
  @Input() partyTooltip: string = "Puolueen kaikkien ehdokkaiden vastausten keskiarvo";
  @Input() baseClass: string = "candidate-answer";
  @Input() radiusNone: string = "0.1em";
  @Input() radiusVoter: string = "0.25em";
  @Input() radiusCandidate: string = "0.5em";
  @Input() radiusBoth: string = "0.5em";
  @Input() showLegend: boolean = false;
  @Input() showLine: boolean = true;

  constructor(
  ) {
  }

  ngOnInit() {
    // Use question as the default source for the data
    if (this.question) {
      ['id', 'text', 'topic', 'category'].forEach( key => {
        if (!this[key]) { this[key] = this.question[key] }
      });
    }
  }

  get matchType(): string {
    return  this.voterAnswer !=null ?
              (this.candidateAnswer != null ?
                (this.voterAnswer == this.candidateAnswer ? 'agree' : 'disagree') :
                'voterOnly') :
              (this.candidateAnswer != null ? 'candidateOnly' : 'none');
  }

  get drawLine(): boolean {
    return this.showLine && this.voterAnswer != null && this.candidateAnswer != null && this.voterAnswer != this.candidateAnswer;
  }

  public getX(i: number, modifier: number = 0): string {
    return ((2 * (i - 1) + 1) * 10 + modifier) + '%';
  }

  /*
  public getTranslateX(i: number): string {
    return `translateX(${this.getX(i)})`;
  }
  */

  public getRadius(i: number): string {
    return  this.voterAnswer == i ?
           (this.candidateAnswer == i ? this.radiusBoth : this.radiusVoter) :
           (this.candidateAnswer == i ? this.radiusCandidate : this.radiusNone);
  }

  public getValueClassName(i: number): string {
    let agreement =  this.voterAnswer == i ?
                    (this.candidateAnswer == i ? 'both' : 'voter') :
                    (this.candidateAnswer == i ? 'candidate' :
                    (this.isBehindLine(i) ? 'behindLine' : 'none'));
    return `${this.baseClass}-value ${this.baseClass}-value--${i} ${this.baseClass}-value--${agreement}`;
  }

  // Check if dot would be under the line
  private isBehindLine(i: number): boolean {
    return this.drawLine &&
           ((i < this.voterAnswer && i > this.candidateAnswer) ||
            (i > this.voterAnswer && i < this.candidateAnswer));
  }

  public getLineClassName(): string {
    return `${this.baseClass}-line ${this.baseClass}-line--length${Math.abs(this.voterAnswer - this.candidateAnswer)}`;
  }

  public getLegendClassName(i: number): string {
    return `${this.baseClass}-legend ${this.baseClass}-legend--${i}`;
  }

  public getVoterTitleClassName(): string {
    if (this.voterAnswer == this.candidateAnswer) {
      return `${this.baseClass}-title ${this.baseClass}-title--${this.voterAnswer} ${this.baseClass}-title--both`;
    } else {
      return `${this.baseClass}-title ${this.baseClass}-title--${this.voterAnswer} ${this.baseClass}-title--voter`;
    }
  }

  public getCandidateTitleClassName(): string {
    if (this.candidateAnswer) {
      return `${this.baseClass}-title ${this.baseClass}-title--${this.candidateAnswer} ${this.baseClass}-title--candidate`;
    } else {
      // Invert value for placing (or center if there's no value from the voter either)
      let value = this.voterAnswer != null ? (this.voterAnswer <= 3 ? 5 : 1) : 3;
      return `${this.baseClass}-title ${this.baseClass}-title--${value} ${this.baseClass}-title--candidateNoAnswer`;
    }
  }

  public getSvgClassName(): string {
    return `${this.baseClass}-svg ${this.baseClass}-svg--${this.matchType}` + (this.showLegend ? ` ${this.baseClass}-svg--hasLegend` : "");
  }

  public getOpenAnswerClassName(): string {
    return `${this.baseClass}-openAnswer ${this.baseClass}-openAnswer--${this.candidateAnswer}`;
  }
}
