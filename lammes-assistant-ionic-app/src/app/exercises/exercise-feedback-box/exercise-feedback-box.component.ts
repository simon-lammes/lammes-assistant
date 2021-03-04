import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ExerciseResult, Experience} from '../../shared/services/exercise/exercise.service';
import {Select} from '@ngxs/store';
import {StudyState} from '../../shared/state/study/study.state';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-exercise-feedback-box',
  templateUrl: './exercise-feedback-box.component.html',
  styleUrls: ['./exercise-feedback-box.component.scss'],
})
export class ExerciseFeedbackBoxComponent {
  @Select(StudyState.lastExperience) experience$: Observable<Experience>;

  @Input() exerciseResult: ExerciseResult;

  @Output()
  nextExerciseRequested = new EventEmitter<boolean>();

  requestNextExercise() {
    this.nextExerciseRequested.next(true);
  }
}
