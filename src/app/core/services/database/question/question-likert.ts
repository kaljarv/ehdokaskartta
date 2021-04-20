import {
  QuestionNumericValue
}  from './question-numeric';

import {
  QuestionSingleNumber,
  QuestionOptionsSingleNumber
} from './question-single-number';

/*
 * Base class for Likert question objects
 */

export const QUESTION_LIKERT_DEFAULT_VALUES: QuestionNumericValue[] = [
  {key: 1, name: 'Täysin eri mieltä'},
  {key: 2, name: ''},
  {key: 3, name: 'Neutraali'},
  {key: 4, name: ''},
  {key: 5, name: 'Täysin samaa mieltä'}
];

export class QuestionLikert extends QuestionSingleNumber {

  /*
   * Overrides
   */
  public voterAnswer: number;
  public partyAverages: {
    [partyId: string]: number
  }

  constructor(
    options: QuestionOptionsSingleNumber,
    defaultValues: QuestionNumericValue[] = QUESTION_LIKERT_DEFAULT_VALUES
  ) {
    super(options, defaultValues);
  }

}

