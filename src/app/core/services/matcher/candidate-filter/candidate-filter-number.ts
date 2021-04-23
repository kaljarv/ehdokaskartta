
import {
  CandidateFilterOptions 
} from './candidate-filter';
import {
  CandidateFilterBasic
} from './candidate-filter-basic';

/*
 * Basic number filter that implements require and exclude
 * but doesn't implement value ranges
 */
export class CandidateFilterNumber extends CandidateFilterBasic {
  readonly isNumeric: boolean = true;

  constructor(
    opts: CandidateFilterOptions,
    values?: any[]
  ) {
    super(opts, values);
  }

  protected _processType(value: any): any {
    return parseFloat(value);
  }

}

