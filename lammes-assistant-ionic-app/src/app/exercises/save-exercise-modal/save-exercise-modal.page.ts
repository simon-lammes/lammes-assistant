import {Component, OnInit} from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomFormsServiceService} from '../../shared/custom-forms-service.service';
import {CreateExerciseResult, ExercisesService} from '../exercises.service';

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
    private exercisesService: ExercisesService,
    private toastController: ToastController
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
    const result = await this.exercisesService.createExercise(this.exerciseForm.value);
    switch (result) {
      case CreateExerciseResult.Success:
        await this.dismissModal();
        break;
      case CreateExerciseResult.Conflict:
        await this.showHint('Please change your title because the current title conflicts with an already existing exercise.');
        break;
    }
  }

  trim(formControlName: string) {
    this.customFormsService.trimAndRemoveNeighboringWhitespaces(this.exerciseForm, formControlName);
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

  private async showHint(message: string) {
    const toast = await this.toastController.create({
      header: message,
      color: 'warning',
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ],
      position: 'top'
    });
    await toast.present();
  }
}
