import { Component, 
         Input } from '@angular/core';
import { DomSanitizer,
         SafeStyle } from '@angular/platform-browser';
import { trigger,
         style,
         animate,
         transition } from '@angular/animations';

import { AvatarComponent,
         ANIMATION_TIMING } from './avatar.component';
 
/*
 * These consts are used for the animations
 */
export const PARTY_AVATAR_DIMENSIONS = {
  width: 22,
  height: 45,
  rootY: 1.4667,
};
const INNER_ALIGNMENT_START_STYLE = style({
  transform: `scaleY(0.0) translate(-${PARTY_AVATAR_DIMENSIONS.rootY}px, 0px)`
});
const INNER_ALIGNMENT_END_TRANSFORM = `scaleY(1.0) translate(-${PARTY_AVATAR_DIMENSIONS.rootY}px, -${PARTY_AVATAR_DIMENSIONS.height}px)`;
const INNER_ALIGNMENT_END_STYLE = style({
  transform: INNER_ALIGNMENT_END_TRANSFORM
});

/*
 * The Avatar component
 * The same component is used for both miniaturised and maximised candidates
 * as well as the voter.
 */
@Component({
  selector: '[partyAvatar]',
  templateUrl: './party-avatar.component.html',
  styleUrls: ['./party-avatar.component.sass'],
  animations: [
    trigger('innerAlignment', [
      transition(':enter', [
        INNER_ALIGNMENT_START_STYLE,
        animate(ANIMATION_TIMING, INNER_ALIGNMENT_END_STYLE),
      ]),
      transition(':leave', [
        INNER_ALIGNMENT_END_STYLE,
        animate(ANIMATION_TIMING, INNER_ALIGNMENT_START_STYLE)
      ]),
    ]),
  ]
})
export class PartyAvatarComponent extends AvatarComponent {
  @Input('partyAvatar') party: string;

  constructor(
    private sanitizer:  DomSanitizer,
  ) {
    super();
  }

  get classNames(): string {
    let c = 'avatar party-avatar';
    if (this.className)
      c += ' ' + this.className;
    return c;
  }

  get style(): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle('transform: ' + INNER_ALIGNMENT_END_TRANSFORM);
  }

}