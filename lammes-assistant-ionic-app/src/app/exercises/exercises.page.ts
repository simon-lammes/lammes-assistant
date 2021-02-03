import {Component, OnInit} from '@angular/core';
import {ModalController, PopoverController} from '@ionic/angular';
import {SaveExerciseModalPage} from './save-exercise-modal/save-exercise-modal.page';
import {Exercise, ExerciseFilter, ExerciseFilterDefinition, ExerciseService} from '../shared/services/exercise/exercise.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ExercisesPopoverComponent, ExercisesPopoverInput} from './exercises-popover/exercises-popover.component';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, filter, first, map, shareReplay, startWith, switchMap, take} from 'rxjs/operators';
import {UserService} from '../shared/services/users/user.service';
import _ from 'lodash';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {debounceFilterQuery} from '../shared/operators/debounce-filter-query';
import {ApplicationConfigurationService} from '../shared/services/application-configuration/application-configuration.service';

const maximumForSigned32Int = Validators.max(2_147_483_647);

interface SelectableExerciseFilter extends ExerciseFilter {
  isSelected: boolean;
  isUnchanged: boolean;
}

@UntilDestroy()
@Component({
  selector: 'app-exercises',
  templateUrl: './exercises.page.html',
  styleUrls: ['./exercises.page.scss'],
})
export class ExercisesPage implements OnInit {
  selectedExerciseFilterSubject: BehaviorSubject<ExerciseFilter>;
  selectedExerciseFilter$: Observable<ExerciseFilter>;
  exerciseFilters$: Observable<SelectableExerciseFilter[]>;
  filteredExercises$: Observable<Exercise[]>;
  currentFilterDefinition$: Observable<ExerciseFilterDefinition>;
  filterForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private exerciseService: ExerciseService,
    private router: Router,
    private popoverController: PopoverController,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private applicationConfigurationService: ApplicationConfigurationService
  ) {
  }

  /**
   * Removes all parts of the filter that have no effect.
   */
  private static trimFilter(exerciseFilter: ExerciseFilterDefinition) {
    const trimmedFilter: ExerciseFilterDefinition = {
      creatorIds: exerciseFilter.creatorIds?.length > 0 ? exerciseFilter.creatorIds : undefined,
      labels: exerciseFilter.labels?.length > 0 ? exerciseFilter.labels : undefined,
      languageCodes: exerciseFilter.languageCodes?.length > 0 ? exerciseFilter.languageCodes : undefined,
      maximumCorrectStreak: exerciseFilter.maximumCorrectStreak ?? undefined,
      exerciseTypes: exerciseFilter.exerciseTypes ?? undefined
    };
    return trimmedFilter;
  }

  async ngOnInit(): Promise<void> {
    const user = await this.userService.currentUser$.pipe(first()).toPromise();
    this.selectedExerciseFilterSubject = new BehaviorSubject<ExerciseFilter>(undefined);
    this.selectedExerciseFilter$ = this.selectedExerciseFilterSubject.asObservable();
    this.selectedExerciseFilter$.pipe(untilDestroyed(this)).subscribe(selectedExerciseFilter => {
      const filterDef = selectedExerciseFilter?.exerciseFilterDefinition;
      // If the form already exists, we do only patch values but not recreate it because
      // that would mess up all listeners we have on the existing form.
      if (this.filterForm) {
        this.filterForm.patchValue({
          creatorIds: filterDef?.creatorIds ?? [user.id],
          labels: filterDef?.labels ?? [],
          languageCodes: filterDef?.languageCodes,
          exerciseTypes: filterDef?.exerciseTypes ?? [],
          maximumCorrectStreak: filterDef?.maximumCorrectStreak
        });
      } else {
        this.filterForm = this.formBuilder.group({
          creatorIds: this.formBuilder.control(filterDef?.creatorIds ?? [user.id]),
          labels: this.formBuilder.control(filterDef?.labels ?? []),
          languageCodes: this.formBuilder.control(filterDef?.languageCodes),
          exerciseTypes: this.formBuilder.control(filterDef?.exerciseTypes ?? []),
          maximumCorrectStreak: this.formBuilder.control(filterDef?.maximumCorrectStreak, [Validators.min(0), maximumForSigned32Int])
        });
      }
    });
    this.currentFilterDefinition$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value as ExerciseFilterDefinition),
      distinctUntilChanged((x, y) => _.isEqual(x, y)),
      filter(() => this.filterForm.valid),
      shareReplay(1)
    );
    this.filteredExercises$ = this.currentFilterDefinition$.pipe(
      debounceFilterQuery(this.applicationConfigurationService.applicationConfiguration$),
      // There might be valid value in this pipe but the filter form might be invalid.
      // Even in that case we don't want to send the query because this could seem
      // to the user as if the form was correct.
      filter(() => this.filterForm.valid),
      switchMap(filterValue => this.exerciseService.getFilteredExercises(filterValue))
    );
    this.exerciseFilters$ = combineLatest([
      this.exerciseService.myExerciseFilters$,
      this.selectedExerciseFilter$,
      this.currentFilterDefinition$
    ]).pipe(
      map(([exerciseFilters, selected, current]) => {
        return exerciseFilters.map(exerciseFilter => {
          const isSelected = exerciseFilter.id === selected?.id;
          const isUnchanged = isSelected && _.isEqual(exerciseFilter.exerciseFilterDefinition, current);
          return {
            ...exerciseFilter,
            isSelected,
            isUnchanged
          } as SelectableExerciseFilter;
        });
      })
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
    const exerciseFilter = this.filterForm.value as ExerciseFilterDefinition;
    const trimmedFilter = ExercisesPage.trimFilter(exerciseFilter);
    await this.router.navigate(['tabs', 'exercises', 'study'], {queryParams: trimmedFilter});
  }

  async removeExercise(exercise: Exercise) {
    await this.exerciseService.removeExercise({id: exercise.id});
  }

  async showPopover(event: any) {
    const validFilter = await this.currentFilterDefinition$.pipe(take(1)).toPromise();
    const popover = await this.popoverController.create({
      component: ExercisesPopoverComponent,
      componentProps: {exerciseFilterDefinition: validFilter} as ExercisesPopoverInput,
      event,
      translucent: true
    });
    return await popover.present();
  }

  async editExercise(exercise: Exercise) {
    const user = await this.userService.currentUser$.pipe(first()).toPromise();
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
    this.currentFilterDefinition$.pipe(untilDestroyed(this)).subscribe(async currentFilter => {
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

  selectFilter(selectedFilter: ExerciseFilter) {
    if (this.selectedExerciseFilterSubject.value?.id === selectedFilter.id) {
      return;
    }
    this.selectedExerciseFilterSubject.next(selectedFilter);
  }

  async deleteExerciseFilter(filterToDelete: ExerciseFilter) {
    await this.exerciseService.deleteExerciseFilter(filterToDelete);
  }

  async updateExerciseFilter(filterToUpdate: ExerciseFilter) {
    const updates = await this.currentFilterDefinition$.pipe(first()).toPromise();
    await this.exerciseService.updateExerciseFilter({
      ...filterToUpdate,
      exerciseFilterDefinition: updates
    });
  }
}
