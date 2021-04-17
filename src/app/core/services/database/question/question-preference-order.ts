import {
  QuestionNumeric,
  QuestionNumericValue,
  QuestionOptionsNumeric
} from './question-numeric';

// NB. Commas, semicolons and whitespace are not allowed in cookie values
export const ITEM_SEPARATOR_IN_STRING = '/';

/*
 * Base class for Likert question objects
 */

export interface QuestionOptionsPreferenceOrder extends QuestionOptionsNumeric {
  values: QuestionNumericValue[],
  partyAverages?: {
    [partyId: string]: number
  }
}

export class QuestionPreferenceOrder extends QuestionNumeric {

  /*
   * Overrides
   */
  public voterAnswer: number[];
  public partyAverages: {
    [partyId: string]: number
  }

  constructor(options: QuestionOptionsPreferenceOrder) {
    super(options);
    if (!options.values || options.values.length === 0)
      throw new Error('QuestionPreferenceOrder must have values!');
  }

  /*
   * Overrides
   */
  public isMissing(value: any): boolean {
    return value == null || !Array.isArray(value) || value.length === 0;
  }

  public convertAnswerToString(value: number[] = this.voterAnswer): string {
    return this.voterAnswer.join(ITEM_SEPARATOR_IN_STRING);
  }

  public parseAnswerFromString(value: string): number[] {
    return value.split(ITEM_SEPARATOR_IN_STRING).map(v => Number(v));
  }

  /*
   * Randomly order values for voter to start choosing
   * Courtesy of CoolAJ86 et al.
   * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
   */
  public getShuffledValues(): QuestionNumericValue[] {
    const values = this.values;
    let currentIndex: number = values.length,
        randomIndex: number,
        temporaryValue: QuestionNumericValue;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = values[currentIndex];
      values[currentIndex] = values[randomIndex];
      values[randomIndex] = temporaryValue;
    }

    return values;
  }

  /*
   * For convenience. Returns the QuestionNumericValues in the voter answer order
   */
  public getVoterAnswerValues(): QuestionNumericValue[] {
    if (!this.voterAnswer)
      return undefined;
    return this.voterAnswer.map(v => this.getValue(v));
  }

  /*
   * TODO:
   * match
   */

}

