import {Component, OnInit} from '@angular/core';
import {ModalController, PopoverController} from '@ionic/angular';
import {SaveExerciseModalPage} from './save-exercise-modal/save-exercise-modal.page';
import {Exercise, ExerciseFilter, ExercisesService} from './exercises.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ExercisesPopoverComponent} from './exercises-popover/exercises-popover.component';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {distinctUntilChanged, filter, first, startWith, switchMap} from 'rxjs/operators';
import {UsersService} from '../shared/services/users/users.service';
import _ from 'lodash';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

const maximumForUnsigned32Int = Validators.max(4_294_967_295);

@UntilDestroy()
@Component({
  selector: 'app-exercises',
  templateUrl: './exercises.page.html',
  styleUrls: ['./exercises.page.scss'],
})
export class ExercisesPage implements OnInit {
  filteredExercises$: Observable<Exercise[]>;
  validFilter$: Observable<any>;
  filterForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private exercisesService: ExercisesService,
    private router: Router,
    private popoverController: PopoverController,
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private activatedRoute: ActivatedRoute
  ) {
  }

  /**
   * Removes all parts of the filter that have no effect.
   */
  private static trimFilter(exerciseFilter: ExerciseFilter) {
    const trimmedFilter: ExerciseFilter = {
      creatorIds: exerciseFilter.creatorIds?.length > 0 ? exerciseFilter.creatorIds : undefined,
      labels: exerciseFilter.labels?.length > 0 ? exerciseFilter.labels : undefined,
      languageCodes: exerciseFilter.languageCodes?.length > 0 ? exerciseFilter.languageCodes : undefined,
      maximumCorrectStreak: exerciseFilter.maximumCorrectStreak ?? undefined
    };
    return trimmedFilter;
  }

  async ngOnInit(): Promise<void> {
    const user = await this.usersService.currentUser$.pipe(first()).toPromise();
    this.filterForm = this.formBuilder.group({
      creatorIds: this.formBuilder.control([user.id]),
      labels: this.formBuilder.control([]),
      languageCodes: this.formBuilder.control([]),
      maximumCorrectStreak: this.formBuilder.control(undefined, [maximumForUnsigned32Int])
    });
    this.validFilter$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value as ExerciseFilter),
      distinctUntilChanged((x, y) => _.isEqual(x, y)),
      filter(() => this.filterForm.valid)
    );
    this.filteredExercises$ = this.validFilter$.pipe(
      switchMap(filterValue => this.exercisesService.getFilteredExercises(filterValue))
    );
    this.setupAutomaticUpdateOfUrlQueryParams();
  }

  async createExercise() {
    const modal = await this.modalController.create({
      component: SaveExerciseModalPage
    });
    return await modal.present();
  }

  async startStudying() {
    const exerciseFilter = this.filterForm.value as ExerciseFilter;
    const trimmedFilter = ExercisesPage.trimFilter(exerciseFilter);
    await this.router.navigate(['tabs', 'exercises', 'study'], {queryParams: trimmedFilter});
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
    const user = await this.usersService.currentUser$.pipe(first()).toPromise();
    const modal = await this.modalController.create({
      component: SaveExerciseModalPage,
      componentProps: {
        editedExercise: exercise,
        doesUserOwnEditedExercise: exercise.creatorId === user.id
      }
    });
    return await modal.present();
  }

  /**
   * Makes sure the current filter is reflected in the url. Inspired by
   * [GitHub](https://docs.github.com/en/github/managing-your-work-on-github/sharing-filters).
   */
  private setupAutomaticUpdateOfUrlQueryParams() {
    this.validFilter$.pipe(untilDestroyed(this)).subscribe(async currentFilter => {
      const trimmedFilter = ExercisesPage.trimFilter(currentFilter);
      await this.router.navigate(
        [],
        {
          relativeTo: this.activatedRoute,
          queryParams: trimmedFilter,
          queryParamsHandling: 'merge'
        });
    });
  }
}
