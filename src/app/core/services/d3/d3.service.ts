import { Injectable } from '@angular/core';

import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
export class D3Service {
  constructor() { }

  get d3(): any {
    return d3;
  }

  public getTransform(k: number = 1, x: number = 0, y: number = 0): any {
    return d3.zoomIdentity.translate(x, y)
                          .scale(k);
  }
}