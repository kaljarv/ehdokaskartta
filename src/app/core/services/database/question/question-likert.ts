import {
  AgreementType,
  QuestionNumeric,
  QuestionOptionsNumeric
} from './question-numeric';

/*
 * Base class for Likert question objects
 */

export interface QuestionOptionsLikert extends QuestionOptionsNumeric {
  partyAverages?: {
    [partyId: string]: number
  }
}

export class QuestionLikert extends QuestionNumeric {

  /*
   * Overrides
   */
  public voterAnswer: number;
  public partyAverages: {
    [partyId: string]: number
  }

  /*
   * These allow changes to Likert scale
   */
  readonly neutralAnswer: number = 3;
  readonly maxAnswer: number = 5;

  constructor(options: QuestionOptionsLikert) {
    super(options);
  }

}

