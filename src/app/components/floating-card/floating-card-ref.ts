import { ComponentRef,
         ElementRef,
         EventEmitter } from '@angular/core';
import { Overlay,
         OverlayRef,
         GlobalPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DragDrop,
         DragRef } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';

import { FloatingCardComponent } from './floating-card.component';
import { FloatingCardPeekElementOptions,
         DEFAULT_FLOATING_CARD_PEEK_ELEMENT_OPTIONS } from './floating-card.config';

export const ANIMATION_DURATION_MS = 225;
export const ANIMATION_TIMING = ANIMATION_DURATION_MS + 'ms cubic-bezier(0.4, 0, 0.2, 1)';
export const FLOATING_CARD_INITIALISED_CLASS = 'floatingCard-panel--initialised';
export const FLOATING_CARD_MAXIMISED_CLASS = 'floatingCard-panel--maximised';
export const FLOATING_CARD_DEFAULT_PEEK_HEIGHT: string = '6rem';
export const CLICK_CANCEL_DURATION = 300; // ms
export const CLOSE_DELAY = 500; // ms to allow for transitioning at close before disposing overlay

export enum FloatingCardState {
  Hidden,
  Peeking,
  Maximised,
  Dismissed,
};

/*
 * Controls the floating card CDK Overlay, which contains
 * a FloatingCardComponent, which in turn contains any
 * Component defined in the FloatingCardConfig passed on
 * to FloatingCardService.open().
 */

export class FloatingCardRef {
  private _peekHeight: string;
  private _dragStartY: number;
  private _dragStartPointerY: number;
  private _cancelClick: boolean = false; // To disable drag end click event on header
  private _initialised: boolean = false;
  private _savedTransition: string;
  public card: ComponentRef<FloatingCardComponent>;
  public dragRef: DragRef;
  public minDragDistance: number = 30;
  public peekElement: ElementRef<HTMLElement>;
  public peekElementOffset: string = '0px';
  public state: FloatingCardState = FloatingCardState.Hidden;
  public dismissed: EventEmitter<void> = new EventEmitter<void>();

  get peekHeight(): string {
    if (this._peekHeight != null) {
      return this._peekHeight;
    } else if (this.peekElement != null) {
      return this.peekElement.nativeElement.clientHeight + 'px';
    } else {
      return FLOATING_CARD_DEFAULT_PEEK_HEIGHT;
    }
  }

  set peekHeight(height: string) {
    this._peekHeight = height;
  }

  get isMaximised(): boolean {
    return this.state === FloatingCardState.Maximised;
  }

  get isPeeking(): boolean {
    return this.state === FloatingCardState.Peeking;
  }

  get isHidden(): boolean {
    return this.state === FloatingCardState.Hidden;
  }

  get isDismissed(): boolean {
    return this.state === FloatingCardState.Dismissed;
  }

  constructor(
    private overlayRef: OverlayRef,
    private overlay: Overlay,
    private dragDrop: DragDrop,
  ) { }

  public attach(portal: ComponentPortal<FloatingCardComponent>): ComponentRef<FloatingCardComponent> {
    return this.card = this.overlayRef.attach(portal);
  }

  public init(): void {
    // We add the initialised class only now as it applies a transition to margin-top,
    // which will result in unwanted effects if applied earlier
    if (!this._initialised) {
      this.overlayRef.addPanelClass(FLOATING_CARD_INITIALISED_CLASS);
      this._initialised = true;
    }
  }

  private _dispose(): void {
    this.overlayRef.dispose();
    this.state = FloatingCardState.Dismissed;
    this.dismissed.emit();
  }

  public close(dontAnimate: boolean = false): void {

    // Move down before disposal
    if (!dontAnimate) {

      const closePos = this.overlayRef.getConfig().positionStrategy as GlobalPositionStrategy;
      closePos.top('125vh'); // We go a bit overboard to counter possible easing
      this.overlayRef.updatePositionStrategy(closePos);
      // Need to update position manually, as the it's not called automatically because only the pos offset is changed, not the main method
      this.overlayRef.updatePosition();  
      this.dragRef.reset();

      setTimeout( () => this._dispose(), CLOSE_DELAY );

    } else {
      this._dispose();
    }
  }

  public backdropClick(): Observable<MouseEvent> {
    return this.overlayRef.backdropClick();
  }

  public toggle(): void {
    if (this.isMaximised) {
      this.peek();
    } else {
      this.maximise();
    }
  }

  public maximise(dragged: boolean = false): void {

    if (this._cancelClick && !dragged) {
      return;
    }

    const position = this.overlayRef.getConfig().positionStrategy as GlobalPositionStrategy;
    position.top();
    this.overlayRef.updatePositionStrategy(position);
    // Need to update position manually, as the it's not called automatically because only the pos offset is changed, not the main method
    this.overlayRef.updatePosition();
    this.overlayRef.addPanelClass(FLOATING_CARD_MAXIMISED_CLASS);
    this.overlayRef.updateScrollStrategy(this.overlay.scrollStrategies.reposition());
    this.state = FloatingCardState.Maximised;

    // this.dragRef.reset();
  }

  public peek(dragged: boolean = false): void {

    if (this._cancelClick && !dragged) {
      return;
    }

    const position = this.overlayRef.getConfig().positionStrategy as GlobalPositionStrategy;
    position.top(`calc(100vh - ${this.peekHeight} - ${this.peekElementOffset})`);
    this.overlayRef.updatePositionStrategy(position);
    // Need to update position manually, as the it's not called automatically because only the pos offset is changed, not the main method
    this.overlayRef.updatePosition();
    this.overlayRef.removePanelClass(FLOATING_CARD_MAXIMISED_CLASS);
    this.overlayRef.updateScrollStrategy(this.overlay.scrollStrategies.block());
    this.state = FloatingCardState.Peeking;

    // this.dragRef.reset();
  }

  public setPeekElement(element: ElementRef<HTMLElement>, peekElementOptions: FloatingCardPeekElementOptions = {}): void {
    let options = {...DEFAULT_FLOATING_CARD_PEEK_ELEMENT_OPTIONS, ...peekElementOptions};

    this.peekElement = element;
    
    // Offset to add below the peeking element
    if (options.offset != null) this.peekElementOffset = options.offset;
    
    // Setup dragging to the overlay's host
    this.dragRef = this.dragDrop.createDrag(this.overlayRef.hostElement)
                                .withHandles([this.peekElement]);
    this.dragRef.lockAxis = 'y';
    this.dragRef.constrainPosition = (p, d) => this._constrainAtTop(p, d);
    this.dragRef.started.subscribe(() => this._onDragStart());
    this.dragRef.ended.subscribe(() => this._onDragEnd());

    // Persistent peek height means we only calculate it once
    if (options.persistentHeight) {
      // This assigns the dynamically calculated height to a static private property
      this.peekHeight = this.peekHeight;
    }

    // Show element unless disabled
    if (!options.dontPeek) {
      // We add a small timeout to allow for the overlay to originally position itself,
      // as init will set some transitions which would otherwise cause glitches
      setTimeout( () => {
        this.init();
        this.peek();
      }, 10);
    } else {
      this.init();
    }
  }

  /* Constrain the dragging to the top of the viewport when maximised.
   * The points are Point types defined in drag-drop 
   * but the definition cannot be easily imported */
  private _constrainAtTop(point, dragRef: DragRef): {x: number, y: number} {

    if (this.isMaximised) {

      if (this._dragStartPointerY == null) {
        // We reset this when dragging started
        // NB. this will result in an error of +/- 1px but that's okay
        this._dragStartPointerY = point.y;

      } else {
        // Otherwise calculate movement
        const deltaY = point.y - this._dragStartPointerY;
        // Change the y coordinate if the total of this drag session would  be negative
        if (deltaY < 0) {
          return {
            x: point.x,
            y: point.y - deltaY
          };
        }
      }

    }
    return point;
  }

  private _onDragStart(): void {
    this._dragStartY = this.dragRef.getFreeDragPosition().y;
    this._dragStartPointerY = null; // See this._constrainAtTop() 
    this._cancelClick = true; // Otherwise we'll get the click elemet
  }

  private _onDragEnd(): void {

    const distance = this.dragRef.getFreeDragPosition().y - this._dragStartY;

    if (distance <= -this.minDragDistance) {
      // Dragged up enough
      this._resetDrag();
      this.maximise(true);

    } else if (distance >= this.minDragDistance) {
      // Dragged down enough
      if (this.isMaximised) {
        this._resetDrag();
        this.peek(true);

      } else {
        this._resetDrag();
        this.close();
      }
      
    } else {
      // Dragged less than threshold, revert to original position
      this._resetDrag();
      if (this.isMaximised) {
        this.maximise(true);
      } else {
        this.peek(true);
      }
      // this.dragRef.reset();
    }

    setTimeout(() => this._cancelClick = false, CLICK_CANCEL_DURATION);
  }

  /*
   * Removes the drag and adds a temporary transition to make resetting drag nice.
   * The trouble is that the maximise/peek is handled using the positioning strategy,
   * which employs margin-top on the element containing the card. Dragging however
   * uses transform3d and targets a different element.
   */
  private _resetDrag(): void {

    // Save current transition
    this._savedTransition = this.dragRef.getRootElement().style.transition;

    // Set transition to handle removing drag
    this.dragRef.getRootElement().style.transition = 'transform ' + ANIMATION_TIMING;

    // Reset drag
    this.dragRef.reset();

    // Set timeout to revert to original transition
    setTimeout(() => this.dragRef.getRootElement().style.transition = this._savedTransition, ANIMATION_DURATION_MS);
    
    // Tried making this nicely by using reposition but that didn't work out.
    // 
    // If going down this route again, add the no transition class in exports
    // and as a global style in component.ts
    //
    // <this file: at start> 
    // export const FLOATING_CARD_NO_TRANSITION_CLASS = 'floatingCard-panel--noTransition';
    //
    // <component.ts: GlobalStylesComp: styles> 
    // .${FLOATING_CARD_NO_TRANSITION_CLASS} {
    //  transition: none;
    // }
    //
    // <this method>
    // Disable transition for this operation
    // this.overlayRef.addPanelClass(FLOATING_CARD_NO_TRANSITION_CLASS);
    //
    // Create a positioning strategy that uses the current position
    // const position = this.overlayRef.getConfig().positionStrategy as GlobalPositionStrategy;
    // position.top(this.dragRef.getFreeDragPosition().y + 'px');
    // this.overlayRef.updatePositionStrategy(position);
    // this.overlayRef.updatePosition(); // Need to update position manually
    //
    // Reset drag
    // this.dragRef.reset();
    //
    // Re-enable transition
    // this.overlayRef.removePanelClass(FLOATING_CARD_NO_TRANSITION_CLASS);
  }

  public getBoundingClientRect(): DOMRect {
    return this.card.location.nativeElement.getBoundingClientRect();
  }
}
