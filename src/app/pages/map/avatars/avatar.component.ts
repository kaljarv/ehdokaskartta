import { Component, 
         Input } from '@angular/core';

export const ANIMATION_TIMING = "2225ms cubic-bezier(0.4, 0, 0.2, 1)";

/*
 * The Avatar component base
 * Actual avatars should extend this component
 */
@Component({
  selector: '[avatar]',
  template: `
    <svg:g [class]="classNames"
           [attr.transform]="positionTransform">
      <svg:g [attr.transform]="scaleTransform">
        <svg:circle r="1" cx="0" cy="0"></svg:circle>
      </svg:g>
    </svg:g>
  `,
})
export class AvatarComponent {
  @Input('avatar') _: any;
  @Input('avatarX') x: number; // Avatar position
  @Input('avatarY') y: number;
  @Input('avatarScale') scale: number = 1.0;
  @Input('avatarClass') className: string;
  @Input('avatarScaleRoot') scaleRoot: number = 4; // The nth root of zoomScale which is used to scale the avatar 

  constructor() {
  }

  get classNames(): string {
    let c = 'avatar';
    if (this.className)
      c += ' ' + this.className;
    return c;
  }

  get positionTransform(): string {
    return `translate(${this.x}, ${this.y})`;
  }

  get scaleTransform(): string {
    return `scale(${this.scale})`;
  }

}