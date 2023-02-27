import {
  QuestionLikert
} from './question-likert';
import {
  QuestionNumericValue,
} from './question-numeric';
import {
  QuestionOptionsSingleNumber
} from './question-single-number';

export const QUESTION_LIKERT_SEVEN_DEFAULT_VALUES: QuestionNumericValue[] = [
  {key: 1, name: $localize `Täysin eri mieltä`},
  {key: 2, name: ''},
  {key: 3, name: ''},
  {key: 4, name: $localize `Ei samaa eikä eri mieltä`},
  {key: 5, name: ''},
  {key: 6, name: ''},
  {key: 7, name: $localize `Täysin samaa mieltä`}
];

export class QuestionLikertSeven extends QuestionLikert {

  /*
   * Overrides
   */

  constructor(
    options: QuestionOptionsSingleNumber,
    defaultValues: QuestionNumericValue[] = QUESTION_LIKERT_SEVEN_DEFAULT_VALUES
  ) {
    super(options, defaultValues);
  }

}

