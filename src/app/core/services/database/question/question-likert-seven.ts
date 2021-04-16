import {
  QuestionLikert,
  QuestionOptionsLikert
} from './question-likert';

export class QuestionLikertSeven extends QuestionLikert {

  /*
   * Overrides
   */
  readonly neutralAnswer: number = 4;
  readonly maxAnswer: number = 7;

  constructor(options: QuestionOptionsLikert) {
    super(options);
  }

}

