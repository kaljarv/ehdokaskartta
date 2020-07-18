import { Pipe, PipeTransform } from '@angular/core';

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
export const LOCALE = "fi-FI";

/*
 * Convert a Finnish string to something usable as a CSS class name
 * Hämeen vaalipiiri => haemeenVaalipiiri
 */
@Pipe({
  name: 'toClassName'
})
export class ToClassNamePipe implements PipeTransform {

  transform(value: string): string {
    let parts = value.split(NAME_SPLIT_RE);
    for (let i = 0; i < parts.length; i++) {
      parts[i] = parts[i].toLocaleLowerCase(LOCALE);
      if (i != 0) {
        parts[i] = parts[i].substring(0,1).toLocaleUpperCase(LOCALE) + parts[i].substring(1);
      }
      for (let j = 0; j < CHAR_CONVERSIONS.length; j++) {
        parts[i] = parts[i].replace(CHAR_CONVERSIONS[j][0], CHAR_CONVERSIONS[j][1].toString());
      }
    }
    return parts.join('');
  }
}
