import { 
  Component,
  Input,
  ViewChild,
  ElementRef, 
  DoCheck, 
} from '@angular/core';
import { 
  trigger,
  style,
  state,
  animate,
  transition,
} from '@angular/animations';
import {
  ANIMATION_TIMING
} from '../../core';

export const OVERFLOW_CLASS = "app-fadeout-expander--overflow";

@Component({
  selector: 'app-fadeout-expander',
  templateUrl: './fadeout-expander.component.html',
  styleUrls: ['./fadeout-expander.component.sass'],
  animations: [
    trigger('toggleExpand', [
      state('open', 
        style({
          height: '{{ height }}',
        }),
        {params: {
          height: "4.35rem",
        }}),
      state('closed', 
        style({
          height: '{{ height }}',
        }),
        {params: {
          height: "4.35rem",
        }}),
      transition('* => *',
        animate(ANIMATION_TIMING)
      ),
    ]),
  ],
})
export class FadeoutExpanderComponent implements DoCheck {
  @Input() fadedMaxHeight: string = "4.35rem";
  @Input() expanded: boolean = false;
  @ViewChild('expander') expanderDiv: ElementRef;
  private _debug = false;

  public hasOverflow: boolean = false;

  constructor() { 
  }

  public toggle(): void {
    if (this.hasOverflow)
      this.expanded = !this.expanded;
  }

  public getTrigger(): { value: string, params: Object } {
    return { 
      value:    this.hasOverflow && !this.expanded ? 'closed' : 'open',
      params: {
        height: this.hasOverflow && this.expanded  ? '*' : this.fadedMaxHeight
      },
    }
  }

  ngDoCheck() {
    // scrollHeight is 0 if the element hasn't been drawn yet
    // TODO This doesn't reset on window resize so change that
    if (!this.hasOverflow && this.expanderDiv &&
        this.expanderDiv.nativeElement.scrollHeight > this.expanderDiv.nativeElement.clientHeight) {
      this.expanderDiv.nativeElement.classList.add(OVERFLOW_CLASS);
      this.hasOverflow = true;
    }
  }
}