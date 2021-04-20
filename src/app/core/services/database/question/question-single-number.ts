import {
  QuestionNumeric,
  QuestionNumericValue,
  QuestionOptionsNumeric,
  QUESTION_NUMERIC_DEFAULT_VALUES
} from './question-numeric';

export interface QuestionOptionsSingleNumber extends QuestionOptionsNumeric {
  values?: QuestionNumericValue[],
  partyAverages?: {
    [partyId: string]: number
  }
}


/*
 * Base class for numeric question objects with one answer
 */

export abstract class QuestionSingleNumber extends QuestionNumeric {
  public voterAnswer: number;
  public partyAverages: {
    [partyId: string]: number
  }
  /*
   * These are initialized in the constructor
   */
  readonly values: QuestionNumericValue[];
  readonly maxAnswer: number;
  readonly minAnswer: number;
  readonly neutralAnswer: number;

  constructor(
    {values, ...options}: QuestionOptionsSingleNumber,
    defaultValues: QuestionNumericValue[] = QUESTION_NUMERIC_DEFAULT_VALUES
  ) {
    super(options);
    // Set values and find min and max
    this.values = values || defaultValues;
    const sorted = this.values.sort((a, b) => a.key - b.key);
    this.minAnswer = sorted[0].key;
    this.maxAnswer = sorted[sorted.length - 1].key;
    this.neutralAnswer = sorted[Math.floor(sorted.length / 2)].key;
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
    return (value - this.minAnswer) / (this.maxAnswer - this.minAnswer);
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