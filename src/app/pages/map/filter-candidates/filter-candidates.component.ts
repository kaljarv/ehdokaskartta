import { Component,
         OnInit, 
         OnDestroy, 
         Inject,
         QueryList,
         ViewChildren } from '@angular/core';
import { AbstractControl,
         FormArray,
         FormBuilder } from '@angular/forms';
import { trigger,
         style,
         state,
         animate,
         transition,
       } from '@angular/animations';

import { Subscription } from 'rxjs';

import { MatBottomSheetRef, 
         MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatExpansionPanel } from '@angular/material/expansion';
import { MatSliderChange } from '@angular/material/slider';

import { MatcherService,
         CandidateFilter,
         CandidateFilterSimple,
         CandidateFilterNumberRange,
         CandidateFilterQuestion,
         Question,
         QuestionNumeric } from '../../../core';
import { SharedService } from '../../../core';

const ANIMATION_TIMING = "225ms cubic-bezier(0.4, 0, 0.2, 1)";

// For choosing the display template
export type FilterType = 'default' | 'range' | 'question';

/*
 * Validator functions
 */
function atLeastOneChecked(fa: FormArray): {} | null {
  if (fa.value.length === 0)
    return null;
  for (let i = 0; i < fa.value.length; i++) {
    if (fa.value[i])
      return null;
  }
  return { noneChecked: "Valitse ainakin yksi vaihtoehdoista." };
}

function atLeastOneUnchecked(fa: FormArray): {} | null {
  if (fa.value.length === 0)
    return null;
  for (let i = 0; i < fa.value.length; i++) {
    if (!fa.value[i])
      return null;
  }
  return { allChecked: "Jätä ainakin yksi vaihtoehdoista valitsematta." };
}

/*
 * <app-filter-candidates>
 */
@Component({
  selector: 'app-filter-candidates',
  templateUrl: './filter-candidates.component.html',
  styleUrls: ['./filter-candidates.component.sass'],
  animations: [
    trigger('toggleRotate', [
      state('A', 
        style({
          transform: 'rotate({{ rotation }}deg)',
        }),
        {params: {
          rotation: 0,
        }}),
      state('B', 
        style({
          transform: 'rotate({{ rotation }}deg)',
        }),
        {params: {
          rotation: 180,
        }}),
      transition('* => *',
        animate(ANIMATION_TIMING)
      ),
    ]),
  ]
})
export class FilterCandidatesComponent implements OnInit, OnDestroy {
  @ViewChildren(MatExpansionPanel) expansionPanels: QueryList<MatExpansionPanel>;
  // These will be cancelled onDestroy
  private _subscriptions: Subscription[] = [];

  public filtersForm = this.fb.group({
    all: this.fb.array([]),
  });
  public filters: CandidateFilter[];
  public anyFilterActive: boolean = false;
  private _toggleRotations: number[] = new Array<number>(); // Tracks the state of the rotations 

  get filtersArray(): FormArray {
    return this.filtersForm.get('all') as FormArray;
  }

  constructor(
    private bottomSheetRef: MatBottomSheetRef,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private matcher: MatcherService,
    private shared: SharedService,
    private fb: FormBuilder,
  ) {
    this._subscriptions.push(this.matcher.filterDataReady.subscribe(() => this.initFilters()));
  }

  ngOnInit(): void {
    // We want to freeze the accordion if a filter becomes invalid
    this.filtersForm.statusChanges.subscribe( status => {
      if (status === 'INVALID') {
        this.freezeAccordion();
      } else if (status === 'VALID' || status === 'DISABLED') {
        this.unfreezeAccordion();
      }
    });
  }

  ngOnDestroy() {
    // Cancel subscriptions
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  public dismiss(event: MouseEvent = null): void {
    this.bottomSheetRef.dismiss();
    if (event != null) event.preventDefault();
  }

  public openLink(event: MouseEvent): void {
    this.dismiss(event);
  }

  initFilters(): void {
    this.filters = this.matcher.getFilters();
    this.filters.forEach( filter => {
      let fa: FormArray;

      if (filter instanceof CandidateFilterSimple) {

        fa = this.fb.array([], atLeastOneChecked);
        filter.getValues().forEach(v => {
          let checked = filter.isExcluded(v) ? false : true;
          let c = this.fb.control(checked);
          fa.push(c);
        });

      } else if (filter instanceof CandidateFilterQuestion) {

        fa = this.fb.array([]);
        this.getSortedValues(filter).forEach(v => {
          let checked = filter.isRequiredMostlyAgree(v);
          let c = this.fb.control(checked);
          fa.push(c);
        });

      } else if (filter instanceof CandidateFilterNumberRange) {

        fa = this.fb.array([]);
        const range = filter.getValueRange();
        const fRange = filter.getFilterRange();
        fa.push(this.fb.control( fRange[0] == null ? range[0] : fRange[0] )); // Min
        fa.push(this.fb.control( fRange[1] == null ? range[1] : fRange[1] )); // Max

      } else {
        throw new Error(`Unimplemented filter type '${filter.constructor.name}'.`);
      }

      if (filter.active) this.anyFilterActive = true;

      this._toggleRotations.push(0);

      this.filtersArray.push(fa);
    });
  }

  public getSortedValues(filter: CandidateFilterQuestion): QuestionNumeric[] {
    return filter.getValues().sort( (a, b) => this._compareQuestions(a, b) );
  }

  // We use this for sorting the questions from the question filter
  private _compareQuestions(questionIdA: string, questionIdB: string): number {
    return this.matcher.compareQuestions(this.matcher.getQuestion(questionIdA), this.matcher.getQuestion(questionIdB));
  }
 
  private _getFormArray(filterIndex: number): FormArray {
    return this.filtersForm.get('all').get(filterIndex.toString()) as FormArray;
  }

  private _getControl(filterIndex: number, controlIndex: number): AbstractControl {
    return this._getFormArray(filterIndex).get(controlIndex.toString());
  }

  // For choosing the display template
  public filterType(filter: CandidateFilter): FilterType {
    if (filter instanceof CandidateFilterQuestion) {
      return 'question';
    } else if (filter instanceof CandidateFilterNumberRange) {
      return 'range';
    } else {
      return 'default';
    }
  }

  private _setAll(filterIndex: number, value: boolean): void {
    this._getFormArray(filterIndex).controls.forEach(c => c.setValue(value));
  }

  public selectAll(filterIndex: number): void {
    this._setAll(filterIndex, true);
  }
  public deselectAll(filterIndex: number): void {
    this._setAll(filterIndex, false);
  }
  public toggleAll(filterIndex: number): void {
    this._setAll(filterIndex, !this.allTrue(filterIndex));
    this._toggleRotations[filterIndex]++;
  }
  public allTrue(filterIndex: number): boolean {
    let values = this._getFormArray(filterIndex).value;
    for (let i = 0; i < values.length; i++) {
      if (!values[i]) return false;
    }
    return true;
  }
  public getToggleRotate(filterIndex: number): { value: string, params: any } {
    return {
      value: (this._toggleRotations[filterIndex] % 2) ? 'A' : 'B',
      params: {
        rotation: this._toggleRotations[filterIndex] * 180,
      }
    }
  }

  public onSubmit(): void {
    this.mergeChanges();
    setTimeout(() => this.dismiss(), 250);
  }

  public clearAllFilters(): void {
    this.filters.forEach(filter => {
      if (filter.active)
        filter.clearRules();
    });
    setTimeout(() => this.dismiss(), 250);
    this.shared.logEvent('filters_clear_all');
  }

  private mergeChanges(): void {
    const values = this.filtersArray.value;
    for (let i = 0; i < values.length; i++) {

      const filter = this.filters[i];
      filter.supressRulesChanged();
      filter.clearRules();

      if (filter instanceof CandidateFilterSimple) {

        const filterValues = filter.getValues();
        for (let j = 0; j < values[i].length; j++) {
          if (!values[i][j]) {
            filter.exclude(filterValues[j]);
          }
        }

      } else if (filter instanceof CandidateFilterQuestion) {

        const filterValues = this.getSortedValues(filter);
        for (let j = 0; j < values[i].length; j++) {
          if (values[i][j]) {
            filter.requireMostlyAgree(filterValues[j]);
          }
        }

      } else if (filter instanceof CandidateFilterNumberRange) {

        filter.setMin(this.getSliderValue(i, 0));
        filter.setMax(this.getSliderValue(i, 1));

      } else {
        throw new Error(`Unimplemented filter type '${filter.constructor.name}'.`);
      }

      // This will emit a changed event that the map component will pick up and apply the filter
      filter.revertRulesChanged();
    }
    this.shared.logEvent('filters_merge', { active: this.matcher.getActiveFilterNames().join(',') });
  }

  public onSliderChange($event: MatSliderChange, filterIndex: number, sliderIndex: number): void {
    const otherSlider = this._getControl(filterIndex, sliderIndex == 0 ? 1 : 0);
    // sliderIndex: 0 = min, 1 = max
    if ((sliderIndex == 0 && otherSlider.value < $event.value) ||
        (sliderIndex == 1 && otherSlider.value > $event.value)) {
      otherSlider.setValue($event.value);
    }
  }

  public getSliderValue(filterIndex: number, sliderIndex: number): number {
    return this._getControl(filterIndex, sliderIndex).value;
  }

  public getSliderValueExplained(filterIndex: number, sliderIndex: number): string {
    const filter = this.filters[filterIndex];

    if (!(filter instanceof CandidateFilterNumberRange))
      throw new Error(`Filter at index ${filterIndex} is not a range.`);

    const value = this.getSliderValue(filterIndex, sliderIndex);
    const range = filter.getValueRange();

    let valueString = (sliderIndex == 0 ? filter.minDescription : filter.maxDescription) + ' ';

    if ((sliderIndex == 0 && value == range[0]) ||
        (sliderIndex == 1 && value == range[1])) {
      valueString += '<span class="candidate-filter-noFilter">(ei rajausta)</span>';
    } else {
      valueString += `${value} ${filter.unitName}`;
    }
    return valueString;
  }

  public getQuestion(questionId: string): Question {
    return this.matcher.getQuestion(questionId);
  }

  // To enable persistent selection when filtering
  public onExpand(index: number): void {
    this.shared.lastOpenCandidateFilter = index;
  }
  public doExpand(index: number): boolean {
    return this.shared.lastOpenCandidateFilter === index && this.filters[index].active;
  }

  public getError(index: number): string | null {
    if (this._getFormArray(index).errors) {
      return Object.values(this._getFormArray(index).errors).join(' ');
    } else {
      return null;
    }
  }

  public freezeAccordion(): void {
    this.expansionPanels.forEach( p => {
      if (!p.expanded)
        p.disabled = true;
    });
  }

  public unfreezeAccordion(): void {
    this.expansionPanels.forEach( p => {
      p.disabled = false;
    });
  }
}
