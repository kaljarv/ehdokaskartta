import {
  QuestionNumeric,
  QuestionNumericValue,
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

export const QUESTION_LIKERT_DEFAULT_VALUES: QuestionNumericValue[] = [
  {key: 1, name: 'Täysin eri mieltä'},
  {key: 2, name: ''},
  {key: 3, name: 'Neutraali'},
  {key: 4, name: ''},
  {key: 5, name: 'Täysin samaa mieltä'}
];

export class QuestionLikert extends QuestionNumeric {

  /*
   * Overrides
   */
  public voterAnswer: number;
  public partyAverages: {
    [partyId: string]: number
  }

  constructor(
    options: QuestionOptionsLikert,
    defaultValues: QuestionNumericValue[] = QUESTION_LIKERT_DEFAULT_VALUES
  ) {
    super(options, defaultValues);
  }

}

