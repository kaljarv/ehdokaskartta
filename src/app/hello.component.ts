import { Component, Input, OnInit } from '@angular/core';

import { D3Service } from './d3/d3.service';
import { SharedService } from './core/shared.service';
import { MatcherService } from './core/matcher.service';


@Component({
  selector: 'hello',
  template: `
    <h1>Hello!</h1>
      <button mat-raised-button
        [routerLink]="['/questions']">Kysymyksiin</button>
  `
})
export class HelloComponent implements OnInit {
  @Input() title: string;

  constructor(
    private matcher: MatcherService,
    private shared: SharedService,
    private d3s: D3Service
  ) {}

  ngOnInit() {
  }
}
