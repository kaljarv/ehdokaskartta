import { 
  CandidateFilter, 
  CandidateFilterOptions 
} from './candidate-filter';

export interface CandidateFilterNumberRangeOptions extends CandidateFilterOptions {
  minDescription?: string;
  maxDescription?: string;
  unitName?: string;
  sliderStep?: number;
}

/*
 * Numeric range filter
 */
export class CandidateFilterNumberRange extends CandidateFilter {
  readonly isNumeric: boolean = true;
  public minDescription: string;
  public maxDescription: string;
  public unitName: string;
  public sliderStep: number = 1;
  protected _rules = {
    min: <number>null,
    max: <number>null,
    excludeMissing: <boolean>null,
  }

  constructor(
    opts: CandidateFilterOptions,
    values?: any[]
  ) {
    super(opts, values);
    // We have to define defaults here, because they would override options arguments 
    // if we defined them with the declarations above
    if (this.minDescription == null) this.minDescription = 'Vähintään';
    if (this.maxDescription == null) this.maxDescription = 'Korkeintaan';
  }

  public getValueRange(): [number, number] {
    let range;
    this._values.forEach(v => {
      if (!range) { 
        range = [v,v];
      } else if (v < range[0]) {
        range[0] = v;
      } else if (v > range[1]) {
        range[1] = v;
      }
    });
    return range;
  }
  public getFilterRange(): [number, number] {
    return [this.getMin(), this.getMax()];
  }

  public getMin(): number | null {
    return this._rules.min;
  }
  public setMin(value: number): void {
    if (value <= this.getValueRange()[0]) {
      this._rules.min = null;
    } else {
      this._rules.min = value;
      if (this._rules.max < value) {
        this._rules.max = null;
      }
    }
    this._changed();
  }
  public unsetMin(): void {
    this._rules.min = this._clearRule(this._rules.min);
    this._changed();
  }

  public getMax(): number | null {
    return this._rules.max;
  }
  public setMax(value: number): void {
    if (value >= this.getValueRange()[1]) {
      this._rules.max = null;
    } else {
      this._rules.max = value;
      if (this._rules.min > value) {
        this._rules.min = null;
      }
    }
    this._changed();
  }
  public unsetMax(): void {
    this._rules.max = this._clearRule(this._rules.max);
    this._changed();
  }

  public setExcludeMissing(value: boolean): void {
    this._rules.excludeMissing = value ? true : null; // Have to check here as we use null for a false value
    this._changed();
  }
  public getExcludeMissing(): boolean {
    return this._rules.excludeMissing ? true : false; // Have to check here as we use null for a false value
  }

  protected _processType(value: any): any {
    return parseFloat(value);
  }

  protected _clearRule(rule: any): any {
    return null;
  }

  get active(): boolean {
    let isActive = false;
    Object.values(this._rules).forEach(r => {
      if (r != null) isActive = true;
    });
    return isActive;
  }

  public match(value: any): boolean {
    if (this.isMissing(value)) {
      if (this._rules.excludeMissing) return false;
      return true;
    } else if ( (this._rules.min == null || value >= this._rules.min) &&
                (this._rules.max == null || value <= this._rules.max) ) {
      return true;
    } else {
      return false;
    }
  }
}
