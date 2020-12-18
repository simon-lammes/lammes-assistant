import {Component, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomFormsServiceService} from '../../shared/custom-forms-service.service';
import {ExercisesService} from '../exercises.service';

@Component({
  selector: 'app-save-exercise-modal',
  templateUrl: './save-exercise-modal.page.html',
  styleUrls: ['./save-exercise-modal.page.scss'],
})
export class SaveExerciseModalPage implements OnInit {
  exerciseForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private customFormsService: CustomFormsServiceService,
    private exercisesService: ExercisesService
  ) {
  }

  ngOnInit(): void {
    this.exerciseForm = this.formBuilder.group({
      title: this.formBuilder.control('', [Validators.required, Validators.min(1)]),
      assignment: this.formBuilder.control(undefined, [Validators.required]),
      solution: this.formBuilder.control(undefined, [Validators.required])
    });
  }

  async dismissModal() {
    await this.modalController.dismiss();
  }

  async saveExercise() {
    await this.exercisesService.createExercise(this.exerciseForm.value);
    await this.dismissModal();
  }

  trim(formControlName: string) {
    this.customFormsService.trim(this.exerciseForm, formControlName);
  }

  onFileChange(event: any, fileFormControlName: string) {
    // Short circuit when the user did not select any files.
    if (!event.target.files || !event.target.files.length) {
      return;
    }
    const [file] = event.target.files;
    this.exerciseForm.patchValue({
      [fileFormControlName]: file
    });
  }
}
