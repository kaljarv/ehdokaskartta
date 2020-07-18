import { CandidateFilter } from './candidate-filter';


/*
 * Basic string filter that implements require and exclude
 */
export class CandidateFilterBasic extends CandidateFilter {
  readonly isNumeric: boolean = false;

  protected _rules: { [name: string]: any } = {
    required: new Set(),
    excluded: new Set(),
  }

  constructor(...args) {
    super(...args);
  }

  // Overrides

  get active(): boolean {
    return (this._rules.required.size + this._rules.excluded.size) > 0;
  }

  public match(value: any): boolean {
    if (this._rules.required.size && this._rules.excluded.size) {
      return this.isRequired(value) && !this.isExcluded(value);
    } else if (this._rules.required.size) {
      return this.isRequired(value);
    } else {
      return !this.isExcluded(value);
    }
  }

  // New methods

  public isRequired(value: any): boolean {
    return this._rules.required.has(value);
  }
  public isExcluded(value: any): boolean {
    return this._rules.excluded.has(value);
  }
  public getRequired(): any[] {
    return Array.from(this._rules.required);
  }
  public getExcluded(): any[] {
    return Array.from(this._rules.excluded);
  }
  public exclude(...values: any): void {
    values.forEach(v => {
      this._rules.excluded.add(this._process(v));
      this._rules.required.delete(this._process(v));
    });
    this._changed();
  }
  public dontExclude(...values: any): void {
    values.forEach(v => this._rules.excluded.delete(this._process(v)));
    this._changed();
  }
  public setExcluded(...values: any): void {
    this._rules.excluded.clear();
    this.exclude(...values);
  }
  public require(...values: any): void {
    values.forEach(v => {
      this._rules.required.add(this._process(v));
      this._rules.excluded.delete(this._process(v));
    });
    this._changed();
  }
  public dontRequire(...values: any): void {
    values.forEach(v => this._rules.required.delete(this._process(v)));
    this._changed();
  }
  public setRequired(...values: any): void {
    this._rules.required.clear();
    this.require(...values);
  }
}
