import { Pipe, PipeTransform } from '@angular/core';

/*
 * Create initials from a name:
 * Matti => M.
 * Pekka-Liisa => P.-L.
 * Raija E. Ruusu => R. E. R.
 */
@Pipe({
  name: 'initials'
})
export class InitialsPipe implements PipeTransform {

  transform(value: string): string {
    // Can't use lookbehing for the first parenthesized group as it's not widely supported
    return value.replace(/(^| |\-)([^\s\-])[^\s\-]+/ig, "$1$2.");
  }
}
