import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FallbackImageDirective } from './fallback-image.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  exports: [
    FallbackImageDirective,
  ],
  declarations: [
    FallbackImageDirective
  ],
})
export class CoreDirectivesModule {}