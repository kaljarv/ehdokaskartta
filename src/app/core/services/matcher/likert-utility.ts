/*
 * Provides 5-scale Likert matching functions for use in matcher and filters
 * Use the exported const Likert object to access methods
 */

export enum AgreementType {
  Agree,
  Disagree,
  OpinionUnknown,
  MostlyAgree, // Within 1 Likert step
  StronglyDisagree, // More than 1 Likert step away
}

export class LikertUtility {
  /*
   * Convenience getters for AgreementTypes
   */
  readonly agree: AgreementType = AgreementType.Agree;
  readonly disagree: AgreementType = AgreementType.Disagree;
  readonly opinionUnknown: AgreementType = AgreementType.OpinionUnknown;
  readonly mostlyAgree: AgreementType = AgreementType.MostlyAgree;
  readonly stronglyDisagree: AgreementType = AgreementType.StronglyDisagree;
  /*
   * Value for a neutral answer, if needed
   */
  readonly neutralAnswer: number = 3;

  constructor() {
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
   * Get the maximally distant answer to the one given
   */
  public invertAnswer(value: any, biasedTowardsFive: boolean = true): number {
    return Number(value) <= (biasedTowardsFive ? 3 : 2) ? 5 : 1;
  }

  /*
   * Check if the value is missing
   */
  public isMissing(value: any): boolean {
    return typeof value === 'undefined' || isNaN(value) || value == null;
  }

  /*
   * Match to values and get their AgreementType
   */
  public match(value1: any, value2: any, strict: boolean = false, allowOpinionUnknown: boolean = true): AgreementType {
   
    if (allowOpinionUnknown && value1 == null) {
      return this.opinionUnknown;
    }

    const dist = this.getDistance(value1, value2);

    if (strict) {
      return dist === 0 ? this.agree: this.disagree;
    }

    switch (dist) {
      case 0:
      case 1:
        return this.mostlyAgree;
      default:
        return this.stronglyDisagree;
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
    return this.match(value1, value2, true) === this.agree;
  }

  public doDisagree(value1: any, value2: any): boolean {
    return this.match(value1, value2, true) === this.disagree;
  }

  public doMostlyAgree(value1: any, value2: any): boolean {
    return this.match(value1, value2, false) === this.mostlyAgree;
  }

  public doStronglyDisagree(value1: any, value2: any): boolean {
    return this.match(value1, value2, false) === this.stronglyDisagree;
  }

  public doHaveOpinionUnknown(value1: any, value2: any = null): boolean {
    return this.match(value1, value2, false) === this.opinionUnknown;
  }

}

// For convenience
export const Likert = new LikertUtility();