import {
  QuestionNumeric,
  QuestionOptionsNumeric
} from './question-numeric';

/*
 * Provides 5-scale Likert matching functions for use in matcher and filters
 */

export enum AgreementType {
  Agree,
  Disagree,
  OpinionUnknown,
  MostlyAgree, // Within 1 Likert step
  StronglyDisagree, // More than 1 Likert step away
}

/*
 * Base class for Likert question objects
 */

export interface QuestionOptionsLikert extends QuestionOptionsNumeric {
  partyAverages?: {
    [partyId: string]: number
  }
}

export class QuestionLikert extends QuestionNumeric {

  /*
   * Overrides
   */
  public voterAnswer: number;
  public partyAverages: {
    [partyId: string]: number
  }

  /*
   * Convenience getters for AgreementTypes
   */
  static readonly agree: AgreementType = AgreementType.Agree;
  static readonly disagree: AgreementType = AgreementType.Disagree;
  static readonly opinionUnknown: AgreementType = AgreementType.OpinionUnknown;
  static readonly mostlyAgree: AgreementType = AgreementType.MostlyAgree;
  static readonly stronglyDisagree: AgreementType = AgreementType.StronglyDisagree;

  /*
   * These allow changes to Likert scale
   */
  readonly neutralAnswer: number = 3;
  readonly maxAnswer: number = 5;

  constructor(options: QuestionOptionsLikert) {
    super(options);
  }

  /*
   * Calc distance between two values
   * NB. If one of the values is missing, it's treated as inverted
   */
  public getDistance(value1: any, value2: any): number {
    if (this.isMissing(value1) && this.isMissing(value2)) {
      throw new Error("Both values to getDistance cannot be missing!");
    } else {
      return Math.abs(
        Number(this.isMissing(value1) ? this.invertAnswer(value2) : value1) -
        Number(this.isMissing(value2) ? this.invertAnswer(value1) : value2)
      );
    }
  }

  /*
   * Match to values and get their AgreementType
   */
  public match(value1: any, value2: any, strict: boolean = false, allowOpinionUnknown: boolean = true): AgreementType {
   
    if (allowOpinionUnknown && value1 == null) {
      return AgreementType.OpinionUnknown;
    }

    const dist = this.getDistance(value1, value2);

    if (strict) {
      return dist === 0 ? AgreementType.Agree: AgreementType.Disagree;
    }

    switch (dist) {
      case 0:
      case 1:
        return AgreementType.MostlyAgree;
      default:
        return AgreementType.StronglyDisagree;
    }
  }

  /*
   * Convenience wrappers for match
   */
  public doMatchAgreementType(value1: any, value2: any, type: AgreementType): boolean {
    switch (type) {
      case AgreementType.Agree:
        return this.doAgree(value1, value2);
      case AgreementType.Disagree:
        return this.doDisagree(value1, value2);
      case AgreementType.MostlyAgree:
        return this.doMostlyAgree(value1, value2);
      case AgreementType.StronglyDisagree:
        return this.doStronglyDisagree(value1, value2);
      case AgreementType.OpinionUnknown:
        return this.doHaveOpinionUnknown(value1);
    }
  }

  public doAgree(value1: any, value2: any): boolean {
    return this.match(value1, value2, true) === AgreementType.Agree;
  }

  public doDisagree(value1: any, value2: any): boolean {
    return this.match(value1, value2, true) === AgreementType.Disagree;
  }

  public doMostlyAgree(value1: any, value2: any): boolean {
    return this.match(value1, value2, false) === AgreementType.MostlyAgree;
  }

  public doStronglyDisagree(value1: any, value2: any): boolean {
    return this.match(value1, value2, false) === AgreementType.StronglyDisagree;
  }

  public doHaveOpinionUnknown(value1: any, value2: any = null): boolean {
    return this.match(value1, value2, false) === AgreementType.OpinionUnknown;
  }
}

