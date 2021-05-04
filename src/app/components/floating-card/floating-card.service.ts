import { 
  Injectable, 
  Injector
} from '@angular/core';
import { DragDrop } from '@angular/cdk/drag-drop';
import { Overlay } from '@angular/cdk/overlay';
import { FloatingCardConfig } from './floating-card-options';
import { FloatingCardRef } from './floating-card-ref';

/*
 * Allow opening of Google Maps-esque overlay cards with custom components.
 * This service is stateless
 *
 * Adapted from https://blog.thoughtram.io/angular/2017/11/20/custom-overlays-with-angulars-cdk.html
 * by Dominic Elm, Thoughtram
 * and https://angular.io/guide/dynamic-component-loader
 * by Google
 */

@Injectable({
  providedIn: 'root'
})
export class FloatingCardService {

  constructor(
    private injector: Injector,
    private overlay: Overlay,
    private dragDrop: DragDrop
  ) {}

  public open(config: FloatingCardConfig): FloatingCardRef {
    return new FloatingCardRef(config, this.injector, this.overlay, this.dragDrop);
  }
}
