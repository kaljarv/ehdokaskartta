import { Component, Input, ViewChild, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { D3Service, BarBlock, DistributionChart, DistributionChartOptions } from './d3.service';
import { SharedService } from '../core/shared.service';
import { MatcherService } from '../core/matcher.service';


/* 
 * A BLOCK
 */

@Component({
  selector: '[bar-block]',
  template: `
    <svg:rect
      [attr.x]="block.x"
      [attr.y]="block.y"
      [attr.width]="block.width"
      [attr.height]="block.height"
      [ngClass]="className"
    ></svg:rect>
    `,
  styles: [`h1 { font-family: Lato; }`]
})
export class BarBlockComponent {
  @Input('bar-block') block: BarBlock;

  constructor(
    private shared: SharedService
  ) {}

  get className() {
    return 'party-' + this.shared.toClassName(this.block.title);
  }
}

/* 
 * THE CHART
 */

@Component({
  selector: 'distribution-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #svgContainer class="svgContainer">
      <svg #svg [attr.width]="options.width" [attr.height]="options.height">
        <svg:g [bar-block]="block" *ngFor="let block of blocks"></svg:g>
      </svg>
    </div>
    `,
  styles: [`h1 { font-family: Lato; }`]
})
export class DistributionChartComponent implements OnInit, AfterViewInit {
  @Input('question-id') questionId: string;
  @Input('padding-ratio') paddingRatio: number;
  @ViewChild('svgContainer') svgContainer;
  public chart: DistributionChart;
  public options: DistributionChartOptions = {
    xCol: null,
    xVals: [1, 2, 3, 4, 5],
    yCol: "party",
    width: 100,
    height: 100,
    padding: 0.65,
    reverse: true
  };

  constructor(
    private matcher: MatcherService,
    private d3s: D3Service,
    private cdRef: ChangeDetectorRef
  ) {
  }

  get blocks() {
    if (this.chart) {
      return this.chart.blocks;
    } else {
      return [];
    }
  }

  ngOnInit() {
    if (this.questionId == null) {
      throw new Error("Missing Input question-id for <distribution-chart>.");
    }
  }

  ngAfterViewInit() {
    this.options['xCol'] = this.questionId;
    this.options['width'] = this.svgContainer.nativeElement.offsetWidth;
    this.options['height'] = this.svgContainer.nativeElement.offsetHeight;
    if (this.paddingRatio != null) {
      this.options['padding'] = this.paddingRatio;
    }
    this.chart = this.d3s.getDistributionChart( this.matcher.getCandidatesAsList(), this.options );
    // We need the timeout to get rid of expression changed error
    setTimeout( () => this.cdRef.markForCheck(), 1);
  }
}
