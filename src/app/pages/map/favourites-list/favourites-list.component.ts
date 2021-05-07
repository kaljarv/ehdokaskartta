import { 
  Component, 
  OnDestroy, 
  OnInit 
} from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatcherService, Candidate } from '../../../core';
import { SharedService } from '../../../core';


/*
 * <app-favourites-list>
 */
@Component({
  selector: 'app-favourites-list',
  templateUrl: './favourites-list.component.html',
  styleUrls: ['./favourites-list.component.sass'],
})
export class FavouritesListComponent 
  implements OnDestroy, OnInit {

  public favourites: Candidate[] = new Array<Candidate>();

  constructor(
    private bottomSheetRef: MatBottomSheetRef,
    private matcher: MatcherService,
    private shared: SharedService,
  ) {
    this.shared.reportOverlayOpen({
      // log() DEBUG TODO REM onboarding: {restart: () => this.onboardingTour?.restart()},
    });
  }

  ngOnInit() {
    this.favourites = this.matcher.getFavouriteCandidates().sort( (a, b) => {
      // Sort favourites by name
      const order = a.surname.localeCompare(b.surname);
      return order !== 0 ? order : a.givenName.localeCompare(b.givenName);
    });
  }

  ngOnDestroy() {
    this.shared.reportOverlayClose();
    this.bottomSheetRef = null;
    this.favourites = null;
  }

  public dismiss(event: MouseEvent = null): void {
    this.bottomSheetRef.dismiss();
    if (event != null) event.preventDefault();
  }

  public openLink(event: MouseEvent): void {
    this.dismiss(event);
  }

  public clearFavourites(): void {
    this.matcher.clearFavourites();
    setTimeout(() => this.dismiss(), 250);
  }

  public getPortraitUrl(candidate: Candidate): string {
    return this.matcher.getCandidatePortraitUrl(candidate.id);
  }

  public showCandidate(candidate: Candidate): void {
    this.shared.showCandidate.emit(candidate.id);
    this.dismiss();
  }
  
  get hasFavourites(): boolean {
    return this.favourites.length > 0;
  }
}
