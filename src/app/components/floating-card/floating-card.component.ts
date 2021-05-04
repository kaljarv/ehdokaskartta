import { 
  Component,
  Injector,
  OnInit,
  Type,
  ViewEncapsulation 
} from '@angular/core';
import { ComponentPortal } from '@angular/cdk/portal';
import { 
  FLOATING_CARD_ANIMATION_TIMING,
  FLOATING_CARD_INITIALISED_CLASS,
  FLOATING_CARD_PANEL_CLASS,
} from './floating-card-options';
import { FloatingCardRefBase } from './floating-card-ref-base';

/*
 * A simple wrapper for floating card content providing styles
 * and a mat-card element as the container.
 * All interactions are handled by FloatingCardRef.
 */ 

/* 
 * A utility component to publish a transition style into the global ns 
 * as well as set the initial margin of the overlay panel so that it's hidden.
 * Note that when the panel is initialized it's positioning strategy has already been set,
 * so margin-top will be set by that.
 */
@Component({
  selector: 'app-floating-card-global-styles',
  template: '',
  styles: [
    `.${FLOATING_CARD_PANEL_CLASS} {
      margin-top: 100vh;
    }
    .${FLOATING_CARD_INITIALISED_CLASS} {
      margin-top: unset;
      transition: margin-top ${FLOATING_CARD_ANIMATION_TIMING};
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
  host: {
    '(window:resize)': 'onWindowResize()'
  },
})
export class FloatingCardComponent implements OnInit {

  public contentPortal: ComponentPortal<any>;

  constructor(
    private floatingCardRef: FloatingCardRefBase,
    private injector: Injector,
    private type: Type<any>
  ) {}

  public get isMaximised(): boolean {
    return this.floatingCardRef.isMaximised;
  }

  /*
   * Need to use this instead of 100vh because of mobile
   */
  public get height(): number {
    return window.innerHeight;
  }

  ngOnInit() {
    // Create content component
    this.contentPortal = new ComponentPortal(this.type, null, this.injector);
  }

  public onWindowResize(): void {
    this.floatingCardRef.onWindowResize();
  }
}