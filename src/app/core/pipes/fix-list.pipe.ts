import { Pipe, PipeTransform } from '@angular/core';

/*
 * Formats a comma-separated list and changes the last comma to an optionally specified and-word.
 * 
 * Usage: {{ 'convert,this,list,' | fixList }}
 * Result: 'convert, this, list'
 * 
 * Usage: {{ 'convert,this,list' | fixList:'and' }}
 * Result: 'convert, this and list'
 * 
 */
@Pipe({
  name: 'fixList'
})
export class FixListPipe implements PipeTransform {
  transform(value: any, andWord?: string): string {
    if (andWord == null) {
      andWord = ',';
    } else {
      andWord = ' ' + andWord;
    }
    return (typeof value === 'string' ? value : value.toString())
              .replace(/(?:\s*,\s*)+/g, ', ')
              .replace(/, $/g, '')
              .replace(/, ([^,]+)$/, andWord + ' $1');
  }
}
