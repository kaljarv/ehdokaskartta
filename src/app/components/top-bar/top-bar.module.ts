import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { TopBarComponent } from './top-bar.component';

/*
 * TODO
 * - Combine the html and sass files into a single one to match the ts file structure
 *   (that was initially separated too, but that resulted in circular dependency warnings)
 */

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  exports: [
    TopBarComponent
  ],
  declarations: [
    TopBarComponent
  ],
})
export class TopBarModule {}