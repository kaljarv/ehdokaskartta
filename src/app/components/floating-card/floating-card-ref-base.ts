import { ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { FloatingCardPeekElementOptions } from './floating-card-options';

/*
 * We need this ugly base class in order to get rid of circular dependencies
 * between FloatingCardRef and FloatingCardComponent, as Ref needs the Component
 * type and Component needs the Ref type for injection.
 */
export abstract class FloatingCardRefBase {

  constructor() {}

  abstract get isMaximised(): boolean;

  abstract init(): void;

  abstract close(dontAnimate?: boolean): void;

  abstract backdropClick(): Observable<MouseEvent>;

  abstract toggle(): void;

  abstract maximise(dragged?: boolean): void;

  abstract peek(dragged?: boolean): void;

  abstract setPeekElement(element: ElementRef<HTMLElement>, peekElementOptions?: FloatingCardPeekElementOptions): void;

  abstract getBoundingClientRect(): DOMRect;

  abstract onWindowResize(): void;
}