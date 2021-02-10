import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';

import { FloatingCardService } from './floating-card.service';
import { FloatingCardGlobalStylesComponent,
         FloatingCardComponent } from './floating-card.component';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    OverlayModule,
    PortalModule,
    DragDropModule,
  ],
  exports: [
    FloatingCardComponent,
  ],
  providers: [
    FloatingCardService,
  ],
  declarations: [
    FloatingCardComponent,
    FloatingCardGlobalStylesComponent,
  ],
})
export class FloatingCardModule {}