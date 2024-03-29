import { 
  AfterViewInit,
  Component, 
  OnDestroy, 
  OnInit,
  ViewChild
} from '@angular/core';
import { 
  FormGroup, 
  FormControl 
} from '@angular/forms';
import { Observable } from 'rxjs';
import { 
  map, 
  startWith 
} from 'rxjs/operators';
import { MatInput } from '@angular/material/input';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { 
  MatcherService, 
  Candidate 
} from '../../../core';
import { SharedService } from '../../../core';


/*
 * <app-favourites-list>
 */
@Component({
  selector: 'candidate-search',
  templateUrl: './candidate-search.component.html',
  styleUrls: ['./candidate-search.component.sass'],
})
export class CandidateSearchComponent
  implements AfterViewInit, OnDestroy, OnInit {

  @ViewChild('candidateNameOrNumberInput') 
  candidateNameOrNumberInput: MatInput;

  public candidates: Candidate[] = new Array<Candidate>();
  public candidateSearchForm = new FormGroup({
    candidateNameOrNumber: new FormControl('')
  });
  public filteredCandidates: Observable<Candidate[]>;

  constructor(
    private bottomSheetRef: MatBottomSheetRef,
    private matcher: MatcherService,
    private shared: SharedService,
  ) {
    this.shared.reportOverlayOpen({});
  }

  ngOnInit() {
    this.setupCandidates();
  }

  ngAfterViewInit() {
    setTimeout(() => this.candidateNameOrNumberInput.focus(), 25);
  }

  ngOnDestroy() {
    this.shared.reportOverlayClose();
    this.bottomSheetRef = null;
    this.candidates = null;
    this.candidateSearchForm = null;
    this.filteredCandidates = null;
  }

  public dismiss(event: MouseEvent = null): void {
    this.bottomSheetRef.dismiss();
    if (event != null) event.preventDefault();
  }

  public displayCandidate(candidate: Candidate): string {
    return candidate ? `${candidate.givenName} ${candidate.surname}` : '';
  }

  public getPortraitUrl(candidate: Candidate): string {
    return this.matcher.getCandidatePortraitUrl(candidate);
  }

  public showCandidate(event?: any): void {
    const candidate = this.candidateSearchForm.controls.candidateNameOrNumber.value;

    if (!candidate || !(candidate instanceof Candidate))
      return;

    this.shared.showCandidate.emit({
      id: candidate.id,
      maximise: ['list', 'browse-list'].includes(this.shared.currentPage)
    });
    this.shared.logEvent('search_show_candidate');
    this.dismiss();
  }

  private setupCandidates(): void {

    this.candidates = this.matcher.getCandidatesAsList().sort( (a, b) => {
      // Sort favourites by name
      const order = a.surname.localeCompare(b.surname);
      return order !== 0 ? order : a.givenName.localeCompare(b.givenName);
    });
    
    this.filteredCandidates = this.candidateSearchForm.controls.candidateNameOrNumber.valueChanges
      .pipe(
        startWith(''),
        map((value: string | Candidate) => value ? this._filter(value) : [])
      );
  }
  
  private _filter(value: string | Candidate): Candidate[] {

    if (value instanceof Candidate)
      return [value];

    const names = value.toLocaleLowerCase('fi-FI').split(/\s+/);
    const number = parseInt(value);

    return this.candidates.filter(c => {
      if (!isNaN(number))
        return c.number === number;
      else
        for (const name of names)
          if (c.surname.toLocaleLowerCase('fi-FI').indexOf(name) === 0 || 
              c.givenName.toLocaleLowerCase('fi-FI').indexOf(name) === 0)
            return true;
      return false;
    });
  }
  
}
