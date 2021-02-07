import {Component, EventEmitter, Input, Output} from '@angular/core';
import {HydratedExercise} from '../../shared/services/exercise/exercise.service';
import {ExerciseState} from '../study/study.page';

@Component({
  selector: 'app-exercise-container',
  templateUrl: './exercise-container.component.html',
  styleUrls: ['./exercise-container.component.scss'],
})
export class ExerciseContainerComponent {
  @Input()
  exercise: HydratedExercise;

  @Output()
  exerciseStateChanged = new EventEmitter<ExerciseState>();

  onExerciseStateChanged(exercise: HydratedExercise, exerciseState: ExerciseState) {
    this.exerciseStateChanged.emit(exerciseState);
  }
}
