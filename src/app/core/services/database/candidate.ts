import {
  Constituency,
  ConstituencyDict
} from './constituency';

import {
  Party,
  PartyDict
} from './party';

import {
  Question
} from './question';

export interface AnswerDict {
  [questionId: string]: any
}

export interface CandidateDetailsLoader {
  (candidate: Candidate): Promise<AnswerDict>;
}

export interface CandidateOptions {
  id: string; // The unique id = constituencyId_number, also used as the key in the dict
  number: number;
  surname: string;
  givenName: string;
  constituencyId: string;
  partyId: string;
  selected: number;
  basicQuestions: AnswerDict;
  detailsLoader: CandidateDetailsLoader;
  constituencyReference: ConstituencyDict;
  partyReference: PartyDict;
}

export type CandidateDict = { 
  [id: string]: Candidate
}

export class Candidate {

  public id: string;
  public number: number;
  public surname: string;
  public givenName: string;
  public constituencyId: string;
  public partyId: string;
  public selected: number;
  public basicQuestions: AnswerDict;
  public constituencyReference: ConstituencyDict;
  public partyReference: PartyDict;
  public detailsLoader: CandidateDetailsLoader;
  public missing: boolean; // Flag to mark candidates who didn't answer the questions but are still included
  public filteredOut = new Set<any>();// Will actually hold references to CandidateFilters
  /*
   * These are needed by the map
   */
  public projX: number;
  public projY: number;
  public x: number;
  public y: number;

  private _cachedQuestions: AnswerDict;

  constructor(options: CandidateOptions) {
    for (const o in options) this[o] = options[o];
  }

  /*
   * Getters and setters
   */

  public get constituency(): Constituency {
    if (this.constituencyId == null)
      return undefined;
    return this.constituencyReference[this.constituencyId];
  }

  public get constituencyName(): string {
    return this.constituency?.name;
  }

  public get party(): Party {
    if (this.partyId == null)
      return undefined;
    return this.partyReference[this.partyId];
  }

  public get partyName(): string {
    return this.party?.name;
  }

  /*
   * Get answer to a question
   * If the questionId is not found in the basic questions, it will
   * be looked for in the cached questions. And error will be thrown
   * if the details aren't loaded in this case.
   */
  public getAnswer(question: string | Question): any {
    let id: string = question instanceof Question ? question.id : question;
    if (id in this.basicQuestions)
      return this.basicQuestions[id];
    if (this._cachedQuestions == null)
      throw new Error("A Candidate's details must be loaded before accessing details questions.");
    return this._cachedQuestions[id];
  }

  /*
   * Call the load the candidate details.
   * The Promise will resolve immediately if they are already loaded.
   */
  public loadDetails(): Promise<Candidate> {
    return new Promise<Candidate>((resolve, reject) => {
      if (this._cachedQuestions == null)
        this.detailsLoader(this).then((data) => {
          this._cachedQuestions = data;
          resolve(this);
        })
      else
        resolve(this);
    });
  }
}
