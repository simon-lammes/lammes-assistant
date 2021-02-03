import {Component, Input} from '@angular/core';
import {CustomFile} from '../../services/exercise/exercise.service';

/**
 * This component is about enriching markdown with base64 images.
 */
@Component({
  selector: 'app-enriched-markdown',
  templateUrl: './enriched-markdown.component.html',
  styleUrls: ['./enriched-markdown.component.scss'],
})
export class EnrichedMarkdownComponent {
  @Input()
  data: string;

  @Input()
  files: CustomFile[];

  /**
   * As explained in the Image section [here](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#images), you can reference
   * images in Markdown. We use this mechanism to enable the user to reference his custom files.
   */
  getEnrichedMarkdown() {
    const files = this.files ?? [];
    return [this.data, ...files.map(file => `[${file.name}]: ${file.value}`)].join('\n\n');
  }
}
