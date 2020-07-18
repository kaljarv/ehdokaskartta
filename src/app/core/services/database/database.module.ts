import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAnalyticsModule,
         ScreenTrackingService,
         DEBUG_MODE } from '@angular/fire/analytics';
import { AngularFirestoreModule } from '@angular/fire/firestore';

import { environment } from '../../../../environments/environment';

import 'firebase/app';
import 'firebase/firestore';

import { DatabaseService } from './database.service';

@NgModule({
  imports: [
    CommonModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule,
    AngularFirestoreModule,
  ],
  providers: [
    AngularFirestore,
    DatabaseService,
    ScreenTrackingService,
    // { provide: DEBUG_MODE, useValue: true },
  ],
})
export class DatabaseModule {}