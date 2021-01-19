import {Component, OnInit} from '@angular/core';
import {ModalController, PopoverController} from '@ionic/angular';
import {SaveExerciseModalPage} from './save-exercise-modal/save-exercise-modal.page';
import {Exercise, ExerciseFilter, ExercisesService} from './exercises.service';
import {Router} from '@angular/router';
import {ExercisesPopoverComponent} from './exercises-popover/exercises-popover.component';
import {FormBuilder, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs';
import {startWith, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-exercises',
  templateUrl: './exercises.page.html',
  styleUrls: ['./exercises.page.scss'],
})
export class ExercisesPage implements OnInit {
  filteredExercises$: Observable<Exercise[]>;
  filter$: Observable<any>;
  filterForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private exercisesService: ExercisesService,
    private router: Router,
    private popoverController: PopoverController,
    private formBuilder: FormBuilder
  ) {
  }

  ngOnInit(): void {
    this.filterForm = this.formBuilder.group({
      creatorIds: this.formBuilder.control([]),
      labels: this.formBuilder.control([])
    });
    this.filter$ = this.filterForm.valueChanges.pipe(startWith(this.filterForm.value as ExerciseFilter));
    this.filteredExercises$ = this.filter$.pipe(
      switchMap(filter => this.exercisesService.getFilteredExercises(filter))
    );
  }

  async createExercise() {
    const modal = await this.modalController.create({
      component: SaveExerciseModalPage
    });
    return await modal.present();
  }

  async startStudying() {
    await this.router.navigateByUrl('/tabs/exercises/study');
  }

  async removeExercise(exercise: Exercise) {
    await this.exercisesService.removeExercise({id: exercise.id});
  }

  async showPopover(event: any) {
    const popover = await this.popoverController.create({
      component: ExercisesPopoverComponent,
      event,
      translucent: true
    });
    return await popover.present();
  }

  async editExercise(exercise: Exercise) {
    const modal = await this.modalController.create({
      component: SaveExerciseModalPage,
      componentProps: {
        editedExercise: exercise
      }
    });
    return await modal.present();
  }
}
