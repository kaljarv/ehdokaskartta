import {
  Question,
  QuestionOptions
} from './question';

/*
 * For matching functions in matcher and filters
 */

export enum AgreementType {
  FullyAgree,
  OpinionUnknown,
  SomewhatDisagree,
  StronglyDisagree
}

/*
 * The values and their associated labels. If name is undefined,
 * the value itself is used. If it's an empty string, no name is displayed.
 */
export type QuestionNumericValue = {
  key: number,
  name?: string
}

export interface QuestionOptionsNumeric extends QuestionOptions {
  partyAverages?: {
    [partyId: string]: number | number[]
  },
  values?: QuestionNumericValue[]
}

export const QUESTION_NUMERIC_DEFAULT_VALUES: QuestionNumericValue[] = [
  {key: 1},
  {key: 2}, 
  {key: 3}, 
  {key: 4}, 
  {key: 5}
];

/*
 * The tolerance used in agreement calculation (on a scale of 0 to 1)
 */
export const QUESTION_NUMERIC_FULLY_AGREE_THRESHOLD = 0.05;

/*
 * The level for minor disagreement on a scale of 0 to 1
 * NB. Epsilon will be added to this
 */
export const QUESTION_NUMERIC_SOMEWHAT_DISAGREE_THRESHOLD = 0.3;

/*
 * Base class for numeric question objects
 * Only numeric questions allow for voter answers and party averages
 * TODO: Move voterAnswer away from Questions and convert Voter to
 * a subclass of Candidate
 * TODO: Convert matching to fuzzy with epsilon and make distance calculation
 * dynamic based on value range
 */

export abstract class QuestionNumeric extends Question {
  public partyAverages:  {
    [partyId: string]: number | number[]
  };
  /*
   * These should be initialized in the constructor
   */
  readonly values: QuestionNumericValue[];
  readonly maxAnswer: number | number[];
  readonly minAnswer: number | number[];
  readonly neutralAnswer: number | number[];
  /*
   * Convenience getters for AgreementTypes
   */
  static readonly fullyAgree: AgreementType       = AgreementType.FullyAgree;
  static readonly somewhatDisagree: AgreementType = AgreementType.SomewhatDisagree;
  static readonly opinionUnknown: AgreementType   = AgreementType.OpinionUnknown;
  static readonly stronglyDisagree: AgreementType = AgreementType.StronglyDisagree;

  protected _voterAnswer: number | number[];

  constructor(
    {partyAverages, values, ...options}: QuestionOptionsNumeric,
    defaultValues: QuestionNumericValue[] = QUESTION_NUMERIC_DEFAULT_VALUES
  ) {
    super(options);
    this.values = values || defaultValues;
    this.partyAverages = partyAverages ?? {};
  }

  get valueKeys(): number[] {
    return this.values.map(v => v.key);
  }

  get voterAnswer(): number | number[] {
    return this._voterAnswer;
  }

  set voterAnswer(value: number | number[]) {
    throw new Error("Not implemented!");
  }

  /*
   * Find a specific value
   * TODO: Convert internal representation to Map
   */
  public getValue(key: number): QuestionNumericValue {
    for (const v of this.values)
      if (v.key === key)
        return v;
    return undefined;
  }
  public getValueIndex(key: number): number {
    for (let i = 0; i < this.values.length; i++)
      if (this.values[i].key === key)
        return i;
    return undefined;
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
   * These are mainly used for storing values in cookies
   * Override if needed.
   */
  public convertAnswerToString(value: number | number[] = this.voterAnswer): string {
    throw new Error("Not implemented!");
  }

  public parseAnswerFromString(value: string): number | number[] {
    throw new Error("Not implemented!");
  }

  /*
   * Get a normalized value (0--1) for mapping
   * Override if needed.
   */
  public normalizeValue(value: number | number[] = this.voterAnswer): number | number[] {
    throw new Error("Not implemented!");
  }

  /*
   * Get the maximally distant answer to the one given
   */
  public invertAnswer(value: any, biasedTowardsMax: boolean = true): number | number[] {
    throw new Error("Not implemented!");
  }

  public getInvertedVoterAnswer(biasedTowardsMax?: boolean): number | number[] {
    throw new Error("Not implemented!");
  }

  /*
   * Calc distance between two values on a scale of 0--1
   */
  public getDistance(value1: any, value2: any, disallowBothMissing: boolean = false): number {
    throw new Error("Not implemented!");
  }

  /*
   * Match to values and get their AgreementType based on the distance
   */
  public match(value1: any, value2: any, allowOpinionUnknown: boolean = true): AgreementType {
    
    if (allowOpinionUnknown && this.isMissing(value1))
      return AgreementType.OpinionUnknown;

    const dist = this.getDistance(value1, value2);

    if (dist <= QUESTION_NUMERIC_FULLY_AGREE_THRESHOLD)
      return AgreementType.FullyAgree;
    if (dist <= QUESTION_NUMERIC_SOMEWHAT_DISAGREE_THRESHOLD)
      return AgreementType.SomewhatDisagree;
    return AgreementType.StronglyDisagree;
  }

  /*
   * For convenience
   */
  public doLooselyAgree(value1: any, value2: any): boolean {
    return [AgreementType.FullyAgree, AgreementType.SomewhatDisagree].includes(this.match(value1, value2));
  }

  public doLooselyDisagree(value1: any, value2: any): boolean {
    return AgreementType.StronglyDisagree === this.match(value1, value2);
  }

  public doStrictlyAgree(value1: any, value2: any): boolean {
    return AgreementType.FullyAgree === this.match(value1, value2);
  }

  public doStrictlyDisagree(value1: any, value2: any): boolean {
    return [AgreementType.StronglyDisagree, AgreementType.SomewhatDisagree].includes(this.match(value1, value2));
  }
}