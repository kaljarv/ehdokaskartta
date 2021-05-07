import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MapCanvasComponent } from './map-canvas.component';


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule
  ],
  exports: [
    MapCanvasComponent
  ],
  declarations: [
    MapCanvasComponent
  ],
})
export class MapCanvasModule {}