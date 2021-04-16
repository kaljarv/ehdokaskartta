export const INDEPENDENT_PARTY_ID = '18';

export type PartyDict = { 
  [partyId: string]: Party 
}

export interface PartyOptions {
  id: string;
  name: string;
  abbreviation?: string;
}

export class Party {

  public id: string;
  public name: string;
  public projX: number;
  public projY: number;

  private _abbreviation: string;

  constructor(options: PartyOptions) {
    for (const o in options) this[o] = options[o];
  }

  get abbreviation(): string {
    return this._abbreviation || this.name;
  }
}
