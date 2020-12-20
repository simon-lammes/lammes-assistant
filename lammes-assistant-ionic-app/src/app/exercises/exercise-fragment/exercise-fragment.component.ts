import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {ExerciseFragment} from '../exercises.service';

/**
 * Only responsible for displaying an ExerciseFragment.
 */
@Component({
  selector: 'app-exercise-fragment',
  templateUrl: './exercise-fragment.component.html',
  styleUrls: ['./exercise-fragment.component.scss'],
})
export class ExerciseFragmentComponent implements OnInit {
  @Input()
  fragment: ExerciseFragment;

  constructor(
    private cd: ChangeDetectorRef
  ) {
  }

  ngOnInit() {
    // The following line is a "quick and dirty" fix.
    // The problem occurred with an exercise fragment containing a large base64-encoded pdf. The pdf-viewer did not render it although
    // it the base64-encoded pdf was definitely provided as source.
    setTimeout(() => this.cd.detectChanges());
  }

}
