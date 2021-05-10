import { AfterViewInit,
         Component, 
         OnInit,
         OnDestroy,
         ViewChild } from '@angular/core';
import { FormGroup, 
         FormControl } from '@angular/forms';
import { Observable,
         Subscription } from 'rxjs';
import { map, 
         startWith } from 'rxjs/operators';
import { MatInput } from '@angular/material/input';
import { SharedService, 
         PATHS, 
         ForwardOptions,
         MatcherService } from '../../core';
import { OnboardingTourComponent } from '../../components';

@Component({
  selector: 'app-constituency-picker',
  templateUrl: './constituency-picker.component.html',
  styleUrls: ['./constituency-picker.component.sass']
})
export class ConstituencyPickerComponent 
  implements AfterViewInit, OnInit, OnDestroy {

  @ViewChild('voterMunicipality')
  onboardingTour: OnboardingTourComponent;
  @ViewChild('voterMunicipalityInput') 
  voterMunicipalityInput: MatInput;

  public municipalities = new Array<any>();
  public municipalityForm = new FormGroup({
    voterMunicipality: new FormControl('')
  });
  public filteredMunicipalities: Observable<string[]>;
  public nextButtonText: string = 'Siirry kysymyksiin';

  private _forwardOptions: ForwardOptions;
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];

  constructor(
    private matcher: MatcherService,
    private shared: SharedService
  ) {

    this.shared.reportPageOpen({
      currentPage: 'constituencyPicker',
      subtitle: null, // ConstituencyPickerTopBarContentComponent
      onboarding: {restart: () => this.onboardingTour?.restart()},
    });

    this._forwardOptions = {
      path: [PATHS.questions], 
      title: this.nextButtonText,
      onBefore: () => this.setMunicipality()
    };
  }

  ngOnInit(): void {
    this._subscriptions.push(this.matcher.constituencyDataReady.subscribe(() => this.setupMunicipalities()));
  }

  ngAfterViewInit() {
    // Onboarding
    this.onboardingTour?.start();
    setTimeout(() => this.voterMunicipalityInput.focus(), 25);
  }

  ngOnDestroy() {
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
    this._subscriptions = null;

    this.onboardingTour = null;
    this.municipalities = null;
    this.municipalityForm = null;
    this.filteredMunicipalities = null;
    this._forwardOptions = null;
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
      let m = this.municipalities.filter( m => m.id === this.matcher.municipalityId)[0];
      this.municipalityForm.controls.voterMunicipality.setValue(m, {emitEvent: true});
      this.enableForward();
    };
  }

  private _filter(value: string): string[] {
    // Check if we already have a valid value, so we can enable submitting the form
    let exact = this.getMunicipalityId(value);
    // We might have already commenced goForward from the optionSelected event
    if (exact !== null)
      this.enableForward();
    else
      this.shared.disableForward.emit();
    return this.filterMunicipalities(value);
  }
 
  public getMunicipalityId(name: string): number | null {
    let matches = this.filterMunicipalities(name);
    if (matches.length > 0 && name.toLocaleLowerCase('fi-FI') === matches[0].name.toLocaleLowerCase('fi-FI'))
      return matches[0].id;
    else
      return null;
  }

  public filterMunicipalities(name: string): any[] {
    const filterValue = name.toLocaleLowerCase('fi-FI');
    return this.municipalities.filter(m => m.name.toLocaleLowerCase('fi-FI').includes(filterValue));
  }

  public getSelectedMunicipalityId(): string | null {
    let value = this.municipalityForm.controls.voterMunicipality.value;
    if (!value)
      return null;
    // Nb. return value from getMunicipalityId() may still be null
    return typeof value === 'string' ? this.getMunicipalityId(value) : value.id;
  }

  // This is called by form.onSubmit and mat-autocomplete.optionSelected
  public goForward(e?:any): void {
    // We have to setTimeout here as otherwise app component might receive
    // the enableForward event after this one :O
    setTimeout(() => this.shared.navigateForward.emit(this._forwardOptions), 5);
  }

  // Set the selected municipality (or the one defined as the argument)
  public setMunicipality(id?: string): void {
    if (id == null)
      id = this.getSelectedMunicipalityId();
    // This will throw an Error if id is bad
    this.matcher.setMunicipality(id);
  }

  public displayMunicipality(m): string {
    return m && m.name ? m.name : '';
  }

  public enableForward(): void {
    this.shared.enableForward.emit(this._forwardOptions);
  }

  public get useMunicipalityAsConstituency(): boolean {
    return this.matcher.config.useMunicipalityAsConstituency;
  }

  public get constituencyName(): string | null {

    if (this.useMunicipalityAsConstituency)
      return null;

    let id = this.getSelectedMunicipalityId();
    if (id == null)
      return null;
      
    return this.matcher.getConstituencyNameByMunicipalityId(id);
  }
}
