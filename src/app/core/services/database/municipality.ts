import { Constituency } from './constituency';

export type MunicipalityDict = {
  [municipalityId: string]: Municipality
}

export interface MunicipalityOptions {
  id: string,
  name: string,
  constituencyId?: string,
  totalCandidates?: number
}

/*
 * We implement Constituency so as to be able to use
 * municipalities as constituencies
 */
export class Municipality 
  implements Constituency {

  readonly id: string;
  readonly name: string;
  readonly totalCandidates: number;

  private _constituencyId: string;

  constructor(options: MunicipalityOptions) {
    for (const o in options)
      this[o] = options[o];
  }

  /*
   * Default to this.id
   */
  get constituencyId(): string { 
    return this._constituencyId == null ? this.id : this._constituencyId;
  }

  set constituencyId(value: string) { 
    this._constituencyId = value;
  }
}