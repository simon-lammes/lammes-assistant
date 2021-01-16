import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {EnrichedMarkdownComponent} from './enriched-markdown.component';
import {MarkdownModule} from 'ngx-markdown';


@NgModule({
  declarations: [
    EnrichedMarkdownComponent
  ],
  exports: [
    EnrichedMarkdownComponent
  ],
  imports: [
    CommonModule,
    MarkdownModule
  ]
})
export class EnrichedMarkdownModule { }
