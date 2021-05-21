import {
  Category,
  CategoryDict,
} from '../category';
import {
  Constituency,
  ConstituencyDict,
  DEFAULT_CONSTITUENCY_ID,
} from '../constituency';

export const MISSING_VALS = [null, [], "-", "", "En halua kertoa"];

export type QuestionDict = { [id: string]: Question }

export interface QuestionOptions {
  id: string;
  order?: number;
  text?: string;
  topic?: string;
  additionalInfo?: string;
  categoryId?: string;
  relatedId?: string;
  dropped?: boolean;
  constituencyId?: number;
  categoryReference?: CategoryDict,
  constituencyReference?: ConstituencyDict,
}

/*
 * Base class for question objects
 */

export abstract class Question {
  public id: string;
  public order: number = Infinity;
  public text?: string;
  public topic?: string;
  public additionalInfo?: string;
  public categoryId?: string;
  public relatedId?: string;
  public dropped?: boolean;
  public constituencyId?: string;
  public categoryReference: CategoryDict;
  public constituencyReference: ConstituencyDict;

  constructor(options: QuestionOptions) {
    for (const o in options) this[o] = options[o];
  }

  public get category(): Category {
    if (this.categoryId == null)
      return undefined;
    return this.categoryReference[this.categoryId];
  }

  public get categoryName(): string {
    return this.category?.name;
  }

  public get constituency(): Constituency {
    if (this.constituencyId == null || this.constituencyId == DEFAULT_CONSTITUENCY_ID)
      return undefined;
    return this.constituencyReference[this.constituencyId];
  }

  public get constituencyName(): string {
    return this.constituency?.name;
  }

  /*
   * Check if the value is missing
   * Override this for special subclasses
   */
  public isMissing(value: any): boolean {
    return value == null || MISSING_VALS.includes(value);
  }
}