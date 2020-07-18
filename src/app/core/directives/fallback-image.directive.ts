import { Directive, 
         Input, 
         ElementRef, 
         HostListener } from '@angular/core';

/*
 * Courtesy of Mohammad Moin
 * Cf. https://medium.com/@Mdmoin07/image-fallback-for-broken-images-angular-aa3d5538ea0
 */

@Directive({
  selector: 'img[appFallbackImage]'
})
export class FallbackImageDirective {

  @Input() appFallbackImage: string;

  constructor(private elementRef: ElementRef) { }

  @HostListener('error')
  loadFallbackOnError() {
    const element: HTMLImageElement = <HTMLImageElement>this.elementRef.nativeElement;
    element.src = this.appFallbackImage || 'assets/images/missing-portrait.svg';
  }

}