import {
  Question,
  QuestionOptions
} from './question';

/*
 * Base class for textual question objects
 * NB. These do not allow for voter answers or party averages
 */

export class QuestionOpen extends Question {
  constructor(options: QuestionOptions) {
    super(options);
  }
}