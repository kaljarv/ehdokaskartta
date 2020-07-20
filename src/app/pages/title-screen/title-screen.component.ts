import { Component, 
         NgZone, 
         OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';

import { SharedService, 
         PATHS } from '../../core/services/shared';

// The delay in ms after animation has loaded to start playing it
export const ANIMATION_DELAY: number = 250;
export const ANIMATION_LOOP_START_FRAME: number = 157; // 156
export const ANIMATION_PATH: string = 'assets/animations/map-vignette.json';

@Component({
  selector: 'app-title-screen',
  templateUrl: './title-screen.component.html',
  styleUrls: ['./title-screen.component.sass'],
  // host: {
  //   "(click)": "onBackgroundClick($event)"
  // },
})
export class TitleScreenComponent implements OnInit {
  public aboutPath: string = PATHS.about;
  public animationOptions: AnimationOptions = {
    path: ANIMATION_PATH ,
    autoplay: false,
    loop: true,
  };
  private _animationItem: AnimationItem;

  constructor(
    private router: Router,
    private shared: SharedService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.shared.hideTopBar.emit();
    this.shared.showFeedbackButton = false;
  }

  animationCreated(animationItem: AnimationItem): void {
    this._animationItem = animationItem;
  }

  animationDomLoaded(): void {
    setTimeout(() => this.ngZone.runOutsideAngular(() =>
      this._animationItem.play()
    ), ANIMATION_DELAY);
  }

  animationLoopCompleted(): void {
    this.ngZone.runOutsideAngular(() =>
      this._animationItem.goToAndPlay(ANIMATION_LOOP_START_FRAME, true)
    );
  }

  public toggleSideNav(event: MouseEvent): void {
    this.shared.toggleSideNav.emit();
    event.stopPropagation();
  }

  public goForward(): void {
    this.router.navigate([PATHS.constituencyPicker]);
  }

  // public onBackgroundClick(event: MouseEvent): void {
  //   this.goForward();
  // }
}
