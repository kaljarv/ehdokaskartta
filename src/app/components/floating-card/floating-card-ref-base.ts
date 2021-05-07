import { 
  ElementRef,
  EventEmitter,
  Type
} from '@angular/core';
import { DragRef } from '@angular/cdk/drag-drop';
import { OverlayRef } from '@angular/cdk/overlay';
import { Observable } from 'rxjs';
import { 
  FloatingCardOptions,
  FloatingCardPeekElementOptions,
  FloatingCardState
} from './floating-card-options';

/*
 * We need this ugly base class in order to get rid of circular dependencies
 * between FloatingCardRef and FloatingCardComponent, as Ref needs the Component
 * type and Component needs the Ref type for injection.
 */
export abstract class FloatingCardRefBase {

  // This will house the FloatingCardComponent but we can't reference it here
  // to ward off circularity
  public card: any;
  public data: any;
  public dismissed: EventEmitter<void>;
  public dragRef: DragRef;
  public minDragDistance: number;
  public options: FloatingCardOptions;
  public overlayRef: OverlayRef;
  public peekElement: ElementRef<HTMLElement>;
  public peekElementOffset: number;
  public state: FloatingCardState;
  public type: Type<any>;

  constructor() {}

  abstract get peekHeight(): number;
  abstract set peekHeight(height: number);
  abstract get isMaximised(): boolean;
  abstract get isPeeking(): boolean;
  abstract get isHidden(): boolean;
  abstract get isDismissed(): boolean;
  abstract get usePortrait(): boolean;
  abstract init(): void;
  abstract close(dontAnimate?: boolean): void;
  abstract backdropClick(): Observable<MouseEvent>;
  abstract toggle(): void;
  abstract maximise(dragged?: boolean): void;
  abstract peek(dragged?: boolean): void;
  abstract initPeek(element: ElementRef<HTMLElement>, peekElementOptions?: FloatingCardPeekElementOptions): void;
  abstract initMaximise(): void;
  abstract getBoundingClientRect(): DOMRect;
  abstract onWindowResize(): void;
}