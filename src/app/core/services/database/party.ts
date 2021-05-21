import {
  AnswerDict
} from './candidate';
import {
  GetAnswer
} from './get-answer';
import {
   Question,
   QuestionDict,
   QuestionNumeric
} from './question';

export const INDEPENDENT_PARTY_ID = '18';

export type PartyDict = { 
  [partyId: string]: Party 
}

export interface PartyOptions {
  id: string;
  name: string;
  questionReference: QuestionDict;
  abbreviation?: string;
}

export class Party implements GetAnswer {

  public id: string;
  public name: string;
  public projX: number;
  public projY: number;
  public questionReference: QuestionDict;

  private _abbreviation: string;

  constructor(options: PartyOptions) {
    for (const o in options) this[o] = options[o];
  }

  get abbreviation(): string {
    return this._abbreviation || this.name;
  }

  set abbreviation(value: string) {
    this._abbreviation = value;
  }

  /*
   * Get the party's average answer to a question
   */
  public getAnswer(question: string | Question): any | undefined {
    let qid: string = question instanceof Question ? question.id : question;

    if (qid in this.questionReference 
        && this.questionReference[qid] instanceof QuestionNumeric) {
      const q = this.questionReference[qid] as QuestionNumeric;
      return q.partyAverages[this.id] ?? undefined;
    }
    
    return undefined;
  }
}
