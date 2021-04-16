import {
  Question,
  QuestionOptions
} from './question';

/*
 * Base class for numeric question objects
 * Only numeric questions allow for voter answers and party averages
 */

export interface QuestionOptionsNumeric extends QuestionOptions {
  partyAverages?: {
    [partyId: string]: number | number[]
  }
}

export abstract class QuestionNumeric extends Question {
  public voterAnswer: number | number[];
  public partyAverages: {
    [partyId: string]: number | number[]
  }
  /*
   * Override these in subclasses
   */
  public maxAnswer: number = 5;
  public minAnswer: number = 1;
  public neutralAnswer: number = 3;

  constructor(options: QuestionOptionsNumeric) {
    super(options);
    this.partyAverages = options.partyAverages ?? {};
  }

  /*
   * Get possible values for this question
   */
  get values(): number[] {
    const vv = [];
    for (let i = this.minAnswer; i <= this.maxAnswer; i++) {
      vv.push(i);
    }
    return vv;
  }

  /*
   * For convenience
   */
  public unsetVoterAnswer(): void {
    this.voterAnswer = undefined;
  }

  /*
   * Override if needed
   */
  public isMissing(value: any): boolean {
    return value == null || isNaN(value);
  }

  /*
   * Get the maximally distant answer to the one given
   */
  public invertAnswer(value: any, biasedTowardsMax: boolean = true): number {
    return Number(value) <= (biasedTowardsMax ? this.neutralAnswer : this.neutralAnswer - 1) ? this.maxAnswer : this.minAnswer;
  }

  public getInvertedVoterAnswer(biasedTowardsMax?: boolean): number {
    if (this.voterAnswer == null)
      throw new Error(`No voter answer for question '${this.id}'.`);
    return this.invertAnswer(this.voterAnswer, biasedTowardsMax);
  }
}