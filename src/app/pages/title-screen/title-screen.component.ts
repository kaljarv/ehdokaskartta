import { 
  Component, 
  NgZone,
  OnDestroy, 
  OnInit,
} from '@angular/core';
import { 
  Router 
} from '@angular/router';
import { 
  Subscription 
} from 'rxjs';

import { 
  AnimationItem 
} from 'lottie-web';
import { 
  AnimationOptions 
} from 'ngx-lottie';

import { 
  MatcherService,
  PATHS,
  SharedService
} from '../../core';

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
export class TitleScreenComponent 
  implements OnInit, OnDestroy {
  
  public aboutPath: string = PATHS.about;
  public animationOptions: AnimationOptions = {
    path: ANIMATION_PATH ,
    autoplay: false,
    loop: true,
  };
  private _animationItem: AnimationItem;
  private _subscriptions: Subscription[] = [];

  constructor(
    private matcher: MatcherService,
    private ngZone: NgZone,
    private router: Router,
    private shared: SharedService,
  ) {
    this.shared.reportPageOpen({
      currentPage: 'titleScreen',
      hideTopBar: true,
      showMapTools: false,
      showFeedbackButton: false
    });
  }

  ngOnInit(): void {
    this._subscriptions.push(this.matcher.constituencyCookieRead.subscribe(() => this.showCookieSnackbar()));
  }

  ngOnDestroy(): void {
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
    this._subscriptions = null;

    this._animationItem = null;
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

  public showCookieSnackbar(): void {
    if (this.matcher.constituencyId != null) {
      this.shared.showSnackBar.emit({
        message: "Käytetään aiemmin syöttämiäsi vastauksia pohjana.",
        actionTitle: "Nollaa vastaukset",
        actionFunction: () => { this.matcher.unsetVoterAnswers() },
      });
    }
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
