import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ModalController} from '@ionic/angular';
import {GroupSelectModalComponent} from './group-select-modal/group-select-modal.component';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {distinctUntilChangedDeeply} from '../../operators/distinct-until-changed-deeply';
import {switchMap} from 'rxjs/operators';
import {Group, GroupService} from '../../services/group/group.service';

@UntilDestroy()
@Component({
  selector: 'app-group-select',
  templateUrl: './group-select.component.html',
  styleUrls: ['./group-select.component.scss'],
  providers: [
    // This is a custom form control for reactive forms!
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => GroupSelectComponent)
    }
  ]
})
export class GroupSelectComponent implements ControlValueAccessor, OnInit {
  @Input()
  label: string;
  /**
   * This text is displayed when no labels are selected.
   */
  @Input()
  noSelectionText = '';
  /**
   * The value provided from the outside.
   */
  inputValue: Set<number>;
  currentGroups$: Observable<Group[]>;
  private onTouched: () => void;
  private currentValueBehaviourSubject = new BehaviorSubject<Set<number>>(new Set<number>());
  private currentValue$ = this.currentValueBehaviourSubject.asObservable();

  constructor(
    private modalController: ModalController,
    private groupService: GroupService
  ) {
  }

  ngOnInit(): void {
    this.currentGroups$ = this.currentValue$.pipe(
      switchMap(groupIds => {
        if (groupIds.size === 0) {
          return of([]);
        }
        return this.groupService.getFilteredGroups({
          groupIds: [...groupIds]
        });
      })
    );
  }

  registerOnChange(fn: any): void {
    this.currentValue$.pipe(
      untilDestroyed(this),
      distinctUntilChangedDeeply()
    ).subscribe(value => {
      fn([...value]);
    });
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(obj: any): void {
    this.inputValue = new Set<number>(obj);
    this.currentValueBehaviourSubject.next(this.inputValue);
  }

  async openGroupSelectModal() {
    const modal = await this.modalController.create({
      component: GroupSelectModalComponent,
      componentProps: {
        initiallySelectedGroupIds: this.currentValueBehaviourSubject.value
      }
    });
    await modal.present();
    const {data: selectedGroupIds} = await modal.onWillDismiss();
    if (!selectedGroupIds) {
      return;
    }
    this.currentValueBehaviourSubject.next(selectedGroupIds);
  }
}
