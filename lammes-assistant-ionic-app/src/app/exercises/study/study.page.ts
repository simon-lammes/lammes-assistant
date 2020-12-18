import {Component} from '@angular/core';
import {ExercisesService} from '../exercises.service';

@Component({
  selector: 'app-study',
  templateUrl: './study.page.html',
  styleUrls: ['./study.page.scss'],
})
export class StudyPage {
  experience$ = this.exercisesService.usersNextExperience$;

  constructor(
    private exercisesService: ExercisesService
  ) {
  }
}
