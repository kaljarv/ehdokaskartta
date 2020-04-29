import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { SharedService, QUESTIONS_PATH, ForwardOptions } from '../core/shared.service';
import { MatcherService } from '../core/matcher.service';

@Component({
  selector: 'app-precinct-picker',
  templateUrl: './precinct-picker.component.html',
})
export class PrecinctPickerComponent implements OnInit {
  public municipalities = new Array<any>();
  public municipalityForm = new FormGroup({
    voterMunicipality: new FormControl('')
  });
  public filteredMunicipalities: Observable<string[]>;
  private forwardOptions: ForwardOptions;

  constructor(
    private matcher: MatcherService,
    private shared: SharedService
  ) {
    this.forwardOptions = {path: [QUESTIONS_PATH], onBefore: () => this.setMunicipality()};
  }

  ngOnInit(): void {
    this.shared.title = "Tervetuloa Ehdokaskartalle!";
    this.shared.subtitle = "Valitse ensin kotikuntasi, jotta saat selville oman vaalipiirisi.";
    this.matcher.precinctDataReady$.subscribe(() => this.setupMunicipalities());
  }

  private setupMunicipalities(): void {
    this.municipalities = this.matcher.getMunicipalitiesAsList();
    // Set value fetched from cookie or saved earlier
    this.filteredMunicipalities = this.municipalityForm.controls.voterMunicipality.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.name),
        map(name => name ? this._filter(name) : this.municipalities.slice())
      );
    if (this.matcher.municipalityId) {
      let m = this.municipalities.filter( m => Number(m.id) === this.matcher.municipalityId)[0];
      this.municipalityForm.controls.voterMunicipality.setValue(m, {emitEvent: true});
      this.enableForward();
    };
  }

  private _filter(value: string): string[] {
    // Check if we already have a valid value, so we can enable submitting the form
    let exact = this.getMunicipalityId(value);
    if (exact !== null) {
      this.enableForward();
    } else {
      this.shared.disableForward.emit();
    }
    return this.filterMunicipalities(value);
  }
 
  public getMunicipalityId(name: string): number | null {
    let matches = this.filterMunicipalities(name);
    if (matches.length > 0 && name.toLocaleLowerCase('fi-FI') === matches[0].name.toLocaleLowerCase('fi-FI')) {
      return matches[0].id;
    } else {
      return null;
    }
  }

  public filterMunicipalities(name: string): any[] {
    const filterValue = name.toLocaleLowerCase('fi-FI');
    return this.municipalities.filter(m => m.name.toLocaleLowerCase('fi-FI').includes(filterValue));
  }

  public getSelectedMunicipalityId(): number | null {
    let value = this.municipalityForm.controls.voterMunicipality.value;
    if (!value) {
      return null;
    }
    // Nb. return value from getMunicipalityId() may still be null
    return typeof value === 'string' ? this.getMunicipalityId(value) : value.id;
  }

  // This is called by form.onSubmit and mat-autocomplete.optionSelected
  public goForward(e?:any): void {
    this.shared.navigateForward.emit(this.forwardOptions);
  }

  // Set the selected municipality (or the one defined as the argument)
  public setMunicipality(id?: number): void {
    if (id == null) {
      id = this.getSelectedMunicipalityId();
    }
    // This will throw an Error if id is bad
    this.matcher.setMunicipality(id);
  }

  public displayMunicipality(m): string {
    return m && m.name ? m.name : '';
  }

  public enableForward(): void {
    this.shared.enableForward.emit(this.forwardOptions);
  }

  public get precinctName(): string | null {
    let id = this.getSelectedMunicipalityId();
    if (id == null) {
      return null;
    }
    return this.matcher.getPrecinctNameByMunicipalityId(id);
  }
}
