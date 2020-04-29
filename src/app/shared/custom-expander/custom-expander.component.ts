import { Component, 
         Directive, 
         Input, 
         ViewChild, 
         ElementRef, 
         AfterViewChecked, 
       } from '@angular/core';
import { AnimationEvent,
         trigger,
         style,
         state,
         animate,
         transition,
       } from '@angular/animations';

export const ANIMATION_TIMING = "225ms cubic-bezier(0.4, 0, 0.2, 1)";
export const SCROLL_OPTIONS = { behavior: "smooth", block: "start", inline: "nearest" };

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
        })),
      state('closed', 
        style({
          height: 0,
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
export class CustomExpanderComponent implements AfterViewChecked {
  @Input() expanded: boolean = false;
  @Input() subtitleMaxHeight: string = "none";
  @Input() disabled: boolean = false;
  @ViewChild('content') contentDiv: ElementRef;

  private _scrollToId: string;

  constructor() {
  }

  ngAfterViewChecked(): void {
    // Disable the expander if there is no content to show
    if (!this.disabled && this.contentDiv) {
      let setDisabled = true;
      const children = this.contentDiv.nativeElement.childNodes;
      // The element is empty either if it has no child nodes or all of them are comments
      for (let i = 0; i < children.length; i++) {
        if (children[i].nodeType !== Node.COMMENT_NODE) {
          setDisabled = false;
          break;
        }
      }
      if (setDisabled) {
        this.disabled = true;
      }
    }
  }

  public toggle(): void {
    if (!this.disabled) {
      this.expanded = !this.expanded;
    }
  }

  public onToggleExpand(event: AnimationEvent): void {
    if (this._scrollToId && event.toState == 'open') {
      const element = event.element.ownerDocument.getElementById(this._scrollToId);
      this._scrollToId = null;
      if (element) {
        element.scrollIntoView(SCROLL_OPTIONS);
      }
    }
  }

  public expandAndScrollTo(elementId: string): void {
    this._scrollToId = elementId;
    this.expanded = true;
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