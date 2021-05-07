import { Component } from '@angular/core';
import { MatcherService } from '../../core';

@Component({
  selector: 'constituency-picker-top-bar-content',
  templateUrl: './constituency-picker-top-bar-content.component.html',
  styleUrls: ['./constituency-picker-top-bar-content.component.sass'],
})
export class ConstituencyPickerTopBarContentComponent {
  constructor(
    private matcher: MatcherService
  ) {}

  public get useMunicipalityAsConstituency(): boolean {
    return this.matcher.config.useMunicipalityAsConstituency;
  }
}