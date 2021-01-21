import {Component, Input, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, map, startWith, switchMap} from 'rxjs/operators';
import {LabelFilter, LabelsService} from '../../services/labels/labels.service';
import {FormBuilder, FormGroup} from '@angular/forms';

@Component({
  selector: 'app-label-selector-modal',
  templateUrl: './label-selector-modal.component.html',
  styleUrls: ['./label-selector-modal.component.scss'],
})
export class LabelSelectorModalComponent implements OnInit {

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private labelsService: LabelsService
  ) {
  }
  @Input()
  initiallySelectedLabels: Set<string>;

  selectedLabelsSubject: BehaviorSubject<Set<string>>;

  selectedLabels$: Observable<Set<string>>;

  allDisplayedLabels$: Observable<string[]>;

  filterForm: FormGroup;

  filter$: Observable<LabelFilter>;

  filterQuery$: Observable<string>;

  filteredLabels$: Observable<string[]>;

  ngOnInit(): void {
    this.selectedLabelsSubject = new BehaviorSubject<Set<string>>(new Set<string>(this.initiallySelectedLabels));
    this.selectedLabels$ = this.selectedLabelsSubject.asObservable();
    this.filterForm = this.fb.group({
      query: this.fb.control('')
    });
    this.filter$ = this.filterForm.valueChanges.pipe(startWith(this.filterForm.value as LabelFilter));
    this.filterQuery$ = this.filter$.pipe(
      map(filter => filter.query),
      distinctUntilChanged()
    );
    this.filteredLabels$ = this.filter$.pipe(
      switchMap(filter => this.labelsService.getFilteredLabels(filter))
    );
    this.allDisplayedLabels$ = combineLatest([
      this.filteredLabels$,
      this.filterQuery$,
      this.selectedLabels$
    ]).pipe(
      map(([filteredLabels, filterQuery, selectedLabels]) => {
        if (!filterQuery) {
          return [...selectedLabels, ...filteredLabels.filter(filteredLabel => !selectedLabels.has(filteredLabel))];
        } else {
          const newLabel = this.labelsService.validLabelFromFilterQuery(filterQuery);
          if (newLabel && !filteredLabels.includes(newLabel)) {
            return [newLabel, ...filteredLabels];
          } else {
            return filteredLabels;
          }
        }
      })
    );
  }

  async cancel() {
    await this.modalController.dismiss();
  }

  onChangeLabelSelection(event: CustomEvent, label: string) {
    const selectedLabels = new Set<string>(this.selectedLabelsSubject.value);
    const {detail: {checked}} = event;
    if (checked) {
      selectedLabels.add(label);
    } else {
      selectedLabels.delete(label);
    }
    this.selectedLabelsSubject.next(selectedLabels);
  }

  async set() {
    await this.modalController.dismiss({
      selectedLabels: this.selectedLabelsSubject.value
    });
  }
}
