import { Component, ViewChild } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';

import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';

import { DetailsQuestionComponent } from './details-question/details-question.component';
import { DetailsCandidateComponent } from './details-candidate/details-candidate.component';
import { FilterCandidatesComponent } from './filter-candidates/filter-candidates.component';
import { SharedService, ForwardOptions } from './core/shared.service';
import { MatcherService } from './core/matcher.service';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent {
  @ViewChild('nextButton') nextButton;
  public forwardOptions: ForwardOptions;
  
  constructor(
    private router: Router,
    private bottomSheet: MatBottomSheet,
    private shared: SharedService,
    private matcher: MatcherService,
  ) {
    this.shared.showQuestion.subscribe( id => 
      this.openBottomSheet(DetailsQuestionComponent, {id: id})
    );
    this.shared.showCandidate.subscribe( id => 
      this.openBottomSheet(DetailsCandidateComponent, {id: id})
    );
    this.shared.showCandidateFilters.subscribe( () => 
      this.openBottomSheet(FilterCandidatesComponent, {})
    );
    this.shared.enableForward.subscribe( options => {
      this.forwardOptions = {...options};
      this.nextButton.disabled = false;
    });
    this.shared.disableForward.subscribe( () => {
      this.forwardOptions = null;
      this.nextButton.disabled = true;
    });
    this.shared.navigateForward.subscribe( options => {
      this.forwardOptions = {...options};
      this.goForward();
    });
    this.router.events.pipe(
      filter(evt => evt instanceof NavigationStart)
      ).subscribe( () => { 
        this.nextButton.disabled = true;
      } );
  }

  openBottomSheet(type, data) {
    this.bottomSheet.open(type, {data: data});
  }

  // TODO: Toggle sidenav on item click for all items
  // TODO: Move bottom tools when sidenav is opened
  unsetVoterAnswers() {
    this.matcher.unsetVoterAnswers();
    this.router.navigate(['/']);
  }

  goForward() {
    this.nextButton.disabled = true;
    if (this.forwardOptions.onBefore) {
      this.forwardOptions.onBefore();
    }
    this.router.navigate(this.forwardOptions.path);
  }

  openCandidateFilters(): void {
    // For the sake consistency, this is done in a silly way by routing via the shared component
    // Cf. subscription in the constructor
    this.shared.showCandidateFilters.emit();
  }

  get title(): string {
    return this.shared.title;
  }
  
  get subtitle(): string {
    return this.shared.subtitle;
  }

  get showTopTools(): boolean {
    return this.shared.showTopTools;
  }
}
