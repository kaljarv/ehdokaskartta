import { Injectable, EventEmitter } from '@angular/core';

export const CHAR_CONVERSIONS = [
  [/ä/g,  'ae'],
  [/ö/g,  'oe'],
  [/Ä/g,  'AE'],
  [/Ö/g,  'OE'],
  [/å/g,  'ao'],
  [/Å/g,  'AO'],
  [/é/g,  'e'],
  [/É/g,  'E']
];
export const NAME_SPLIT_RE = /[\s\-]+/;
export const MAP_PATH = 'map';
export const QUESTIONS_PATH = 'questions';

export interface ForwardOptions {
  path: any[],          // The path array to navigate
  onBefore?: () => void // An optional callback function that is called before navigating
}

@Injectable()
export class SharedService {
  public title = 'Tervetuloa Ehdokaskarttaan'; // TODO use an Observable instead
  public subtitle = ''; // TODO use an Observable instead
  public lastOpenCandidateDetailsTab = 0; // For details-candidate tabs
  public lastOpenCandidateFilter = null; // For filter-candidates expansion panels
  public showTopTools = false;

  public showQuestion = new EventEmitter<string>();
  public showCandidate = new EventEmitter<string>();
  public showCandidateFilters = new EventEmitter<void>();
  public enableForward = new EventEmitter<ForwardOptions>();
  public disableForward = new EventEmitter<void>();
  public navigateForward = new EventEmitter<ForwardOptions>();

  constructor() { }

  /* An utility function that converts a Finnish string
   * to something usable as a CSS class name.
   * Hämeen vaalipiiri => haemeenVaalipiiri */
  public toClassName(name: string): string {
    let parts = name.split(NAME_SPLIT_RE);
    let loc = 'fi-FI';
    for (let i = 0; i < parts.length; i++) {
      parts[i] = parts[i].toLocaleLowerCase(loc);
      if (i != 0) {
        parts[i] = parts[i].substring(0,1).toLocaleUpperCase(loc) + parts[i].substring(1);
      }
      for (let j = 0; j < CHAR_CONVERSIONS.length; j++) {
        parts[i] = parts[i].replace(CHAR_CONVERSIONS[j][0], CHAR_CONVERSIONS[j][1].toString());
      }
    }
    return parts.join('');
  }
}