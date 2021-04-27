import { 
  AfterViewInit,
  Component, 
  NgZone,
  OnDestroy, 
  OnInit 
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
  OnboardingService,
  SharedService,
  StepOptions,
  PATHS
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
  implements AfterViewInit, OnInit, OnDestroy {

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
    private onboarding: OnboardingService,
    private router: Router,
    private shared: SharedService,
  ) {
    this.shared.currentPage = 'titleScreen';
    this.shared.hideTopBar = true;
    this.shared.showFeedbackButton = false;
  }

  ngOnInit(): void {
    this._subscriptions.push(this.matcher.constituencyCookieRead.subscribe(() => this.showCookieSnackbar()));
  }

  ngAfterViewInit() {

    // Onboarding
    
    const steps: StepOptions[] = [
      {
        id: 'intro',
        attachTo: { 
          element: '#nextButton', 
          on: 'bottom'
        },
        title: 'Tervetuloa Ehdokaskartalle!',
        text:
          `Ehdokaskartta tarjoaa kokeellisen näkymän Ylen vaalikoneen tietoihin. Sovellus käyttää evästeitä ainoastaan käytettävyyden parantamiseksi. Vastauksesti tallennetaan ainoastaan omiin evästeisiisi, jotta voit jatkaa käyttöä myöhemmin siitä, mihin jäit. Käyttötietoja kerätään ainoastaan tilastollisesti siten, ettei käyttäjiä voida yksilöidä.<br>
          Avaa Ehdokaskartta painamalla painiketta.`
      }
    ];
    this.onboarding.startOnboarding(steps);
  }

  ngOnDestroy(): void {
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
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
