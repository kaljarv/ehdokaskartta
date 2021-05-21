import { QuestionOptions } from './question';
import { QuestionOpen } from './question-open';

/*
 * Base class for textual question objects which may have multiple answers
 * TODO: Implement functionalities
 */

export class QuestionOpenMultiple extends QuestionOpen {
  constructor(options: QuestionOptions) {
    super(options);
  }
}