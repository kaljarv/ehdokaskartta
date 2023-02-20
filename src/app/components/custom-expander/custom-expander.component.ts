import { 
  Component, 
  Directive, 
  DoCheck,
  ElementRef, 
  EventEmitter, 
  Input, 
  OnDestroy,
  Output, 
  ViewChild
} from '@angular/core';
import { 
  animate,
  AnimationEvent,
  style,
  state,
  transition,
  trigger
} from '@angular/animations';
import {
  ANIMATION_TIMING
} from '../../core';

// const SCROLL_OPTIONS = { behavior: "smooth", block: "start", inline: "nearest" };

/*
 * <app-custom-expander>
 *
 * @Input expanded = false; whether the expander is initially in expanded state
 * @Input subtitleMaxHeight = "none"; an optional max-height for the subtitle
 * 
 */

@Component({
  selector: 'app-custom-expander',
  templateUrl: './custom-expander.component.html',
  styleUrls: ['./custom-expander.component.sass'],
  animations: [
    trigger('toggleExpand', [
      state('open', 
        style({
          height: '*',
          paddingBottom: '1.5rem',
        })),
      state('closed', 
        style({
          height: 0,
          paddingBottom: '0rem',
        })),
      transition('* => *',
        animate(ANIMATION_TIMING)
      ),
    ]),
    trigger('toggleExpandSubtitle', [
      state('open', 
        style({
          height: '*'
        })),
      state('closed', 
        style({
          height: 0
        })),
      transition('* => *',
        animate(ANIMATION_TIMING)
      ),
    ]),
    trigger('toggleRotate', [
      state('normal', 
        style({
          transform: 'rotate(0deg)',
        })),
      state('rotated', 
        style({
          transform: 'rotate(-180deg)',
        })),
      transition('* => *',
        animate(ANIMATION_TIMING)
      ),
    ]),
  ]
})
export class CustomExpanderComponent 
  implements DoCheck, OnDestroy {

  @Input() expanded: boolean = false;
  @Input() subtitleMaxHeight: string = "none";
  @Input() disabled: boolean = false;
  // The delay in ms after expanding and scrolling to the desired element
  // This is needed to counter some bugs, so it probably shouldn't be set to zero
  @Input() scrollDelay: number = 100;
  @Output() afterCollapse: EventEmitter<void> = new EventEmitter<void>();
  @Output() afterExpand: EventEmitter<string> = new EventEmitter<string>();
  @ViewChild('content') contentDiv: ElementRef;

  private _scrollToId: string;

  constructor() {
  }

  ngDoCheck(): void {
    // Disable the expander if there is no content to show
    if (!this.disabled && this.contentDiv) {
      let setDisabled = true;
      const children = this.contentDiv.nativeElement.childNodes;
      // The element is empty either if it has no child nodes or all of them are comments
      for (let i = 0; i < children.length; i++)
        if (children[i].nodeType !== Node.COMMENT_NODE) {
          setDisabled = false;
          break;
        }
      if (setDisabled)
        this.disabled = true;
    }
  }

  ngOnDestroy(): void {
    this.afterCollapse = null;
    this.afterExpand = null;
    this.contentDiv = null;
  }

  public toggle(): void {
    if (!this.disabled) {
      this.expanded = !this.expanded;
    }
  }

  public onToggleExpand(event: AnimationEvent): void {

    if (this._scrollToId && event.toState == 'open') {

      // We have to use a timeout here as otherwise the parent.scrollHeight / .clientHeight comparisons don't work
      // reliably. The delay may also help orientation a bit
      setTimeout( () => {

        const element = event.element.ownerDocument.getElementById(this._scrollToId);

        if (element) {

          // Locate the scrollable element and scroll it
          let parent = element.parentElement;

          do {

            // If the scrollHeight is greater (by a little margin), the element has content to scroll
            if (parent.scrollHeight - parent.clientHeight > 2) {

              // We'll change scroll-behavior to smooth, so we'll need to save the old one
              const oldBehavior = parent.style.scrollBehavior;
              parent.style.scrollBehavior = 'smooth';

              // Scroll
              parent.scrollTop = element.offsetTop;

              // Revert scroll-behavior
              parent.style.scrollBehavior = oldBehavior;

              // Set parent to null to stop loop
              parent = null;

            } else {
              // Move up one level
              parent = parent.parentElement;
            }
          } while (parent);

          // This was buggy and doens't work on all browsers
          // element.scrollIntoView(SCROLL_OPTIONS);

        }

        // Fire event (check for existence, bc it might be destroyed)
        if (this.afterExpand)
          this.afterExpand.emit(this._scrollToId);

        // Reset this
        this._scrollToId = null;

      }, this.scrollDelay);

    } else if (event.toState == 'open') {
      // Fire event (check for existence, bc it might be destroyed)
      if (this.afterExpand)
        this.afterExpand.emit(null);
    } else {
      // Fire event (check for existence, bc it might be destroyed)
      if (this.afterCollapse)
        this.afterCollapse.emit();
    }
  }

  public expandAndScrollTo(elementId: string, event?: Event): void {
    this._scrollToId = elementId;
    this.expanded = true;
    if (event) 
      event.stopPropagation();
  }
}


/*
 * <app-custom-expander-title>
 */

@Directive({
  selector: 'app-custom-expander-title'
})
export class CustomExpanderTitleDirective {}


/*
 * <app-custom-expander-subtitle>
 */

@Directive({
  selector: 'app-custom-expander-subtitle'
})
export class CustomExpanderSubtitleDirective {}