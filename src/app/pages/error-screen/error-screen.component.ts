import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { 
  MatcherService,
  SharedService,
  PATHS
} from '../../core';

@Component({
  selector: 'app-error-screen',
  templateUrl: './error-screen.component.html',
  styleUrls: ['./error-screen.component.sass'],
})
export class ErrorScreenComponent {

  public errorMessage: string = 'Sovelluksessa tapahtui virhe, pahoittelut!';
  public icon: string = 'warning';
  public paths = PATHS;

  constructor(
    private matcher: MatcherService,
    private router: Router,
    private shared: SharedService
  ) { 
    this.shared.reportPageOpen({
      currentPage: 'error',
      subtitle: null
    });

    const state = this.router.getCurrentNavigation().extras.state;
    if (state?.title != null)
      this.errorMessage = state.title;
    if (state?.icon != null)
      this.icon = state.icon;
  }

  public goToStart(): void {
    this.router.navigate(['']);
  }

}