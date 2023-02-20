import { Pipe, PipeTransform } from '@angular/core';
/*
 * Adds a full stop (or another supplied punctuation mark) to the end of the string 
 * if there is no other punctuation and uppercases the first letter.
 * 
 * Usage: {{ 'convert this string' | sentencify }}
 * Result: 'Convert this string.'
 * 
 * Usage: {{ 'questionify this string' | sentencify:'?' }}
 * Result: 'Questionify this string?'
 * 
 */
@Pipe({
  name: 'sentencify'
})
export class SentencifyPipe implements PipeTransform {
  transform(value: string, punctuation: string = "."): string {
    if (value == null) return '';
    let first, rest;
    [ first, ...rest ] = value;
    return [ first.toLocaleUpperCase('fi-FI'), ...rest, punctuation ].join('')
             .replace(/([\.\!\?\:\;\,–—])[\.\!\?\:\;\,–—]$/, "$1")
             .replace(/\s*\.$/, ".");
  }
}
