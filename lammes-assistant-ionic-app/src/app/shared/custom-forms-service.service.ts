import { Injectable } from '@angular/core';
import {FormGroup} from '@angular/forms';

/**
 * A service providing general-purpose functionality in the context of forms.
 */
@Injectable({
  providedIn: 'root'
})
export class CustomFormsServiceService {

  /**
   * Trims the input of the user.
   */
  trim(form: FormGroup, formControlName: string) {
    const control = form.controls[formControlName];
    control.patchValue(control.value.trim());
  }
}
