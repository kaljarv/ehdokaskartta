import { Constituency } from './constituency';

export type MunicipalityDict = {
  [municipalityId: string]: Municipality
}

export interface MunicipalityOptions {
  id: string,
  name: string,
  constituencyId?: string,
}

/*
 * We implement Constituency so as to be able to use
 * municipalities as constituencies
 */
export class Municipality 
  implements Constituency {

  readonly id: string;
  readonly name: string;

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