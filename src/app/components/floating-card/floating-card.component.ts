import { Component,
         Directive,
         Injector,
         OnInit,
         ViewEncapsulation } from '@angular/core';
import { ComponentPortal, 
         PortalInjector, } from '@angular/cdk/portal';

import { FloatingCardConfig,
         FLOATING_CARD_DATA } from './floating-card.config';
import { FloatingCardRef,
         ANIMATION_TIMING,
         FLOATING_CARD_INITIALISED_CLASS } from './floating-card-ref';

/*
 * A simple wrapper for floating card content providing styles
 * and a mat-card element as the container.
 * All interactions are handled by FloatingCardRef.
 */ 

/* 
 * A utility class to publish a transition style into the global ns 
 */
@Component({
  selector: 'app-floating-card-global-styles',
  template: '',
  styles: [
    `.${FLOATING_CARD_INITIALISED_CLASS} {
      transition: margin-top ${ANIMATION_TIMING};
    }`
  ],
  encapsulation: ViewEncapsulation.None,
})
export class FloatingCardGlobalStylesComponent {
  constructor() {}
}


/* 
 * The component proper
 */
@Component({
  selector: 'app-floating-card',
  templateUrl: './floating-card.component.html',
  styleUrls: ['./floating-card.component.sass'],
})
export class FloatingCardComponent implements OnInit {
  public contentPortal: ComponentPortal<any>;

  public get isMaximised(): boolean {
    return this.floatingCardRef.isMaximised;
  }

  constructor(
    private config: FloatingCardConfig,
    private floatingCardRef: FloatingCardRef,
    private injector: Injector,
  ) {}

  ngOnInit() {
    // Create injector
    const injectionTokens = new WeakMap();
    injectionTokens.set(FloatingCardRef, this.floatingCardRef);
    injectionTokens.set(FLOATING_CARD_DATA, this.config.data);

    const injector = new PortalInjector(this.injector, injectionTokens);

    // Create content component
    this.contentPortal = new ComponentPortal(this.config.component, null, injector);
  }
}