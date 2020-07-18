import { Component,
         OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
  
import { MatcherService,
         Candidate } from '../../../core';
import { SharedService } from '../../../core';


/*
 * <app-favourites-list>
 */
@Component({
  selector: 'app-favourites-list',
  templateUrl: './favourites-list.component.html',
  styleUrls: ['./favourites-list.component.sass'],
})
export class FavouritesListComponent implements OnInit {
  public favourites: Candidate[] = new Array<Candidate>();

  constructor(
    private bottomSheetRef: MatBottomSheetRef,
    private matcher: MatcherService,
    private shared: SharedService,
  ) {
  }

  ngOnInit() {
    this.favourites = this.matcher.getFavouriteCandidates().sort( (a, b) => {
      // Sort favourites by name
      const order = a.surname.localeCompare(b.surname);
      return order !== 0 ? order : a.givenName.localeCompare(b.givenName);
    });
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
  
}
