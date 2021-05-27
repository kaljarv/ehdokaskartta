import {
  QuestionNumeric,
  QuestionNumericValue,
  QuestionOptionsNumeric,
  QUESTION_NUMERIC_DEFAULT_VALUES
} from './question-numeric';

export interface QuestionOptionsSingleNumber extends QuestionOptionsNumeric {
  partyAverages?:  {
    [partyId: string]: number
  },
  values?: QuestionNumericValue[]
}


/*
 * Base class for numeric question objects with one answer
 */

export abstract class QuestionSingleNumber extends QuestionNumeric {
  public partyAverages:  {
    [partyId: string]: number
  };
  /*
   * These are initialized in the constructor
   */
  readonly values: QuestionNumericValue[];
  readonly maxAnswer: number;
  readonly minAnswer: number;
  readonly neutralAnswer: number;
  readonly answerRange: number;

  /*
   * Overrides
   */
  protected _voterAnswer: number;

  constructor(
    {values, ...options}: QuestionOptionsSingleNumber,
    defaultValues: QuestionNumericValue[] = QUESTION_NUMERIC_DEFAULT_VALUES
  ) {
    super(options, defaultValues);
    // Set values and find min and max
    const sorted = this.values.sort((a, b) => a.key - b.key);
    this.minAnswer = sorted[0].key;
    this.maxAnswer = sorted[sorted.length - 1].key;
    this.neutralAnswer = sorted[Math.floor(sorted.length / 2)].key;
    this.answerRange = this.maxAnswer - this.minAnswer;
  }


  /*
   * Overrides
   */
  get voterAnswer(): number {
    return this._voterAnswer;
  }

  /*
   * We need to make a copy of the value to skirt possible reference issues
   */
  set voterAnswer(value: number) {
    this._voterAnswer = value;
  }

  /*
   * These are mainly used for storing values in cookies
   * Override if needed.
   */
  public convertAnswerToString(value: number = this.voterAnswer): string {
    return value.toString();
  }

  public parseAnswerFromString(value: string): number {
    return Number(value);
  }

  /*
   * Get a normalized value (0--1) for mapping
   * Override if needed.
   */
  public normalizeValue(value: number = this.voterAnswer): number {
    return (value - this.minAnswer) / this.answerRange;
  }

  /*
   * Calc distance between two values on a scale of 0--1
   * NB. If one of the values is missing, it's treated as inverted
   */
  public getDistance(value1: any, value2: any, disallowBothMissing: boolean = false): number {
    if (this.isMissing(value1) && this.isMissing(value2)) {
      if (disallowBothMissing)
        throw new Error("Both values to getDistance cannot be missing!");
      return 0;
    }

    return Math.abs(
      Number(this.isMissing(value1) ? this.invertAnswer(value2) : value1) -
      Number(this.isMissing(value2) ? this.invertAnswer(value1) : value2)
    ) / this.answerRange;
  }

  /*
   * Get the maximally distant answer to the one given
   */
  public invertAnswer(value: number | string, biasedTowardsMax: boolean = true): number {
    return Number(value) <= (biasedTowardsMax ? this.neutralAnswer : this.neutralAnswer - 1) ? this.maxAnswer : this.minAnswer;
  }

  public getInvertedVoterAnswer(biasedTowardsMax?: boolean): number {
    return this.invertAnswer(this.voterAnswer, biasedTowardsMax);
  }

}