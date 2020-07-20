import { ComponentRef,
         Injectable, 
         Injector, } from '@angular/core';
import { Overlay, 
         OverlayConfig, } from '@angular/cdk/overlay';
import { ComponentPortal, 
         PortalInjector, } from '@angular/cdk/portal';
import { DragDrop } from '@angular/cdk/drag-drop';

import { FloatingCardConfig,
         FLOATING_CARD_DATA } from './floating-card.config';
import { FloatingCardComponent } from './floating-card.component';
import { FloatingCardRef,
         FloatingCardState } from './floating-card-ref';

/*
 * Allow opening of Google Maps-esque overlay cards with custom components.
 * This service is stateless
 *
 * Adapted from https://blog.thoughtram.io/angular/2017/11/20/custom-overlays-with-angulars-cdk.html
 * by Dominic Elm, Thoughtram
 * and https://angular.io/guide/dynamic-component-loader
 * by Google
 */

const DEFAULT_OVERLAY_CONFIG: any = {
  hasBackdrop: false,
  backdropClass: 'floatingCard-backdrop', // NB. we don't have a backdrop by default, though
  disposeOnNavigation: true, 
  maxWidth: '42rem',
  panelClass: 'floatingCard-panel', 
  width: '100%',
}

@Injectable({
  providedIn: 'root'
})
export class FloatingCardService {

  constructor(
    private injector: Injector,
    private overlay: Overlay,
    private dragDrop: DragDrop,
  ) { }

  public open(config: FloatingCardConfig): FloatingCardRef {

    // Create overlay config
    let overlayConfig = {...DEFAULT_OVERLAY_CONFIG};

    if (config.options.panelClass)
      overlayConfig.panelClass = config.options.panelClass;

    let positionStrategy = this.overlay.position()
      .global()
      .centerHorizontally();
    
    // TODO These are redundantly defined here and implicitly in FloatingCardRef: move defs there and use those.
    //      Actually, also check if most of this stuff with the overlayRef should actually be moved to within
    //      the FloatingCardRef, because passing these refs to the constructor is messy.
    if (config.options.hiddenWhenOpened) {
      positionStrategy = positionStrategy.top(`${window.innerHeight}px`);
    } else {
      positionStrategy = positionStrategy.top(`calc(${window.innerHeight}px - ${config.options.minimizedHeight})`);
    }
    overlayConfig.positionStrategy = positionStrategy;
    overlayConfig.scrollStrategy = this.overlay.scrollStrategies.block();

    // Create overlay
    const floatingCardRef = new FloatingCardRef(this.overlay.create(new OverlayConfig(overlayConfig)), this.overlay, this.dragDrop);

    // Create injector
    const injectionTokens = new WeakMap();
    injectionTokens.set(FloatingCardConfig, config);
    injectionTokens.set(FloatingCardRef, floatingCardRef);

    // injectionTokens.set(FLOATING_CARD_DATA, config.data);

    const injector = new PortalInjector(this.injector, injectionTokens);

    // Create content component
    const containerPortal = new ComponentPortal(FloatingCardComponent, null, injector);
    floatingCardRef.attach(containerPortal);

    // const containerRef: ComponentRef<FloatingCardComponent> = floatingCardRef.attach(containerPortal);
    // const overlayComponent = containerRef.instance;

    if (!config.options.hiddenWhenOpened) {
      // Initialise unless the card stays hidden, in which case
      // setPeekElement will handle init
      floatingCardRef.init();
      floatingCardRef.state = FloatingCardState.Peeking;
    }
    
    return floatingCardRef;
  }
}
