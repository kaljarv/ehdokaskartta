import { Injectable, Directive, Input, ElementRef } from '@angular/core';

import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
export class D3Service {
  constructor() { }

  getDistributionChart(answers, options) {
    return new DistributionChart(answers, options);
  }
}


export interface DistributionChartOptions {
  width: number,
  height: number,
  xCol: string,
  xVals: number[],
  yCol: string,
  padding?: number,
  reverse?: boolean
}


export class BarBlock {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public title?: string
  ) {}
}


export class DistributionChart {
  public blocks: BarBlock[] = new Array();

  constructor( 
      private answers: any[], 
      options: any )
  {
    this.initChart(options);
  }

  initChart(options: DistributionChartOptions): void {
    // TODO Caveat, cannot use a 'false' value as xCol or yCol
    if (!options || !options.width || !options.height || !options.xCol || !options.xVals || !options.yCol ) {
      throw new Error('missing options when initializing DistributionChart');
    }
    if (!options.padding) {
      options.padding = 0.5;
    }
    if (!options.reverse) {
      options.reverse = false;
    }
    let margin = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
    
    let data = {};
    let keys = new Set();

    this.answers.forEach( a => keys.add(a[options.yCol]) );

    options.xVals.forEach( v => {
      let d  = { _x_value: v };
      keys.forEach( k => {
        d[k.toString()] = 0;
      } );
      data[v] = d;
    });

    this.answers.forEach( a => {
      let val = a[options.xCol];
      // This skips missing and other incorrect values
      // TODO Resolve casting to number some other way, this is prone to cause errors
      if (options.xVals.includes(Number(val))) {
        data[val][a[options.yCol]]++;
      }
    });

    let dataArray = [];
    options.xVals.forEach( v => dataArray.push(data[v]) );

    let series = d3.stack()
      .keys(Array.from(keys))
      (dataArray);

    // Create mapping functions for the dimensions
    let getX = d3.scaleBand()
      .domain(options.xVals)
      .range([margin.left, options.width - margin.right])
      .paddingInner(options.padding)
      .paddingOuter(options.padding/2)
      
    let yRange = [options.height - margin.bottom, margin.top];
    if (options.reverse) {
      yRange = yRange.reverse();
    }
    let getY = d3.scaleLinear()
      .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
      .rangeRound(yRange)

    series.forEach( yArr => {
      yArr.forEach( d => {
        let height = getY(d[0]) - getY(d[1]);
        if (options.reverse) {
          height = getY(d[1]) - getY(d[0]);
        }

        this.blocks.push(new BarBlock(
          getX(d.data["_x_value"]),           // x: number,
          getY(d[options.reverse ? 0 : 1]),   // y: number,
          getX.bandwidth(),                   // width: number,
          height,                             // height: number,
          yArr.key,                           // title?: string
        ));
      });
    });
    // console.log(data, dataArray, series, this.blocks);
  }
}