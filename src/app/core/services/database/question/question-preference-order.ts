import {
  QuestionNumeric,
  QuestionOptionsNumeric
} from './question-numeric';

/*
 * Base class for Likert question objects
 */

export interface QuestionOptionsPreferenceOrder extends QuestionOptionsNumeric {
  values: string[],
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

  private _valueNames: string[];

  constructor({values, ...options}: QuestionOptionsPreferenceOrder) {
    super(options);
    // Set values
    this._valueNames = values;
    this.maxAnswer = values.length - 1;
    this.minAnswer = 0;
    this.neutralAnswer = undefined;
  }

  /*
   * Overrides
   */
  public isMissing(value: any): boolean {
    return value == null || !Array.isArray(value) || value.length === 0;
  }

  get valueNames(): string[] {
    return this._valueNames;
  }

  /*
   * TODO:
   * match
   */
}

