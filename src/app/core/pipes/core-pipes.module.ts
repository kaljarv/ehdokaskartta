import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AbbreviatePipe } from './abbreviate.pipe';
import { FixListPipe } from './fix-list.pipe';
import { FixSpacesPipe } from './fix-spaces.pipe';
import { GenitivePipe } from './genitive.pipe';
import { InitialsPipe } from './initials.pipe';
import { LcFirstPipe } from './lc-first.pipe';
import { SentencifyPipe } from './sentencify.pipe';
import { ToClassNamePipe } from './to-classname.pipe';
import { UcFirstPipe } from './uc-first.pipe';

@NgModule({
  imports: [
    CommonModule,
  ],
  exports: [
    AbbreviatePipe,
    FixListPipe,
    FixSpacesPipe,
    GenitivePipe,
    InitialsPipe,
    LcFirstPipe,
    SentencifyPipe,
    ToClassNamePipe,
    UcFirstPipe,
  ],
  declarations: [
    AbbreviatePipe,
    FixListPipe,
    FixSpacesPipe,
    GenitivePipe,
    InitialsPipe,
    LcFirstPipe,
    SentencifyPipe,
    ToClassNamePipe,
    UcFirstPipe,
  ],
  providers: [
    AbbreviatePipe,
    FixListPipe,
    FixSpacesPipe,
    GenitivePipe,
    InitialsPipe,
    LcFirstPipe,
    SentencifyPipe,
    ToClassNamePipe,
    UcFirstPipe,
  ],
})
export class CorePipesModule {}