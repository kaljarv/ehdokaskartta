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
}