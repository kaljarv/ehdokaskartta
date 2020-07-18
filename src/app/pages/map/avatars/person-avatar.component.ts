import { Component, 
         Input } from '@angular/core';
import { trigger,
         style,
         state,
         group, 
         query,
         animate,
         animateChild,
         keyframes,
         transition } from '@angular/animations';

import { AvatarComponent,
         ANIMATION_TIMING } from './avatar.component';
 
export type AvatarState = 'default' | 'zoomed' | 'active' | 'filteredOut';
export type AvatarType = 'voter' | 'candidate';

/*
 * These consts are used for the animations
 */
export const AVATAR_DIMENSIONS = {
  // Measurements of the avatar parts when body is present
  width: 21.8877,
  height: 63.6995,
  headX: 10.9439,
  headY: 12.2001, 
  headR: 5.0,
};
const INNER_ALIGNMENT_START_STYLE = style({
  transform: 'translate(0px, 0px)',
});
const INNER_ALIGNMENT_END_STYLE = style({
  transform: `translate(-${AVATAR_DIMENSIONS.width / 2}px, -${AVATAR_DIMENSIONS.height}px)`,
});

/*
 * The PersonAvatar component
 * The same component is used for both miniaturised and maximised candidates
 * as well as the voter.
 */
@Component({
  selector: '[personAvatar]',
  templateUrl: './person-avatar.component.html',
  styleUrls: ['./person-avatar.component.sass'],
  animations: [
    trigger('innerAlignment', [
      state('noBody', INNER_ALIGNMENT_START_STYLE), 
      state('hasBody', INNER_ALIGNMENT_END_STYLE), 
      transition('noBody => hasBody', group([
        animate(ANIMATION_TIMING, keyframes([
          INNER_ALIGNMENT_START_STYLE,
          INNER_ALIGNMENT_END_STYLE,
        ])),
        query('@*', [animateChild()]),
      ])),
      transition('hasBody => noBody', group([
        animate(ANIMATION_TIMING, keyframes([
          INNER_ALIGNMENT_END_STYLE,
          INNER_ALIGNMENT_START_STYLE,
        ])),
        query('@*', [animateChild()]),
      ]))
    ]),
    trigger('headPosition', [
      state('noBody', style({
          cx: 0,
          cy: 0,
      })),
      state('hasBody', style({
          cx: AVATAR_DIMENSIONS.headX, 
          cy: AVATAR_DIMENSIONS.headY, 
      })),
      transition('* => *', animate(ANIMATION_TIMING)),
    ]),
    trigger('bodyAppear', [
      transition(':enter', [
        style({
          transform: `translateX(-${AVATAR_DIMENSIONS.headX}px)  scaleY(0.0)`
        }),
        animate(ANIMATION_TIMING, style({
          transform: 'translateX(0px) scaleY(1.0)'
        })),
      ]),
      transition(':leave', [
        style({
          transform: 'translateX(0px) scaleY(1.0)'
        }),
        animate(ANIMATION_TIMING, style({
          transform: `translateX(-${AVATAR_DIMENSIONS.headX}px)  scaleY(0.0)`
        }))
      ]),
    ]),
  ],
})
export class PersonAvatarComponent extends AvatarComponent {
  @Input('personAvatar') type: AvatarType = 'candidate';
  @Input('avatarState') state: AvatarState = 'default';
  public headRBase = AVATAR_DIMENSIONS.headR; // For candidate heads, which are also used as the bodyless markers, should be in line with the body
  public headRFilteredOut = AVATAR_DIMENSIONS.headR / 2;

  constructor() {
    super();
  }

  get filteredOut(): boolean {
    return this.state === 'filteredOut';
  }

  get isVoter(): boolean {
    return this.type === 'voter';
  }

  get classNames(): string {
    let c = 'avatar person-avatar';
    if (this.className)
      c += ' ' + this.className;
    c += ` ${this.type} ${this.state}`; // eg. +' candidate filteredOut'
    return c;
  }

  get headR(): number {
    return this.filteredOut ? this.headRFilteredOut : this.headRBase;
  }

  get bodyType(): string | null {
    if (this.isVoter) {
      return 'normal';
    } else if (this.filteredOut) {
      return null;
    } else {
      switch (this.state) {
        case 'zoomed':
          return 'normal';
        case 'active':
          return 'active';
        default:
          return null;
      }
    }
  }

  get animationTrigger(): string {
    return this.bodyType ? 'hasBody' : 'noBody';
  }

}