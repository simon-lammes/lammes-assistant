import {Injectable} from '@angular/core';
import {AbstractControl} from '@angular/forms';

/**
 * A service providing general-purpose functionality in the context of forms.
 */
@Injectable({
  providedIn: 'root'
})
export class CustomFormsService {

  /**
   * Trims the input of the user and makes sure that whitespaces are not next to each other: 'a   b' becomes 'a b'.
   */
  trimAndRemoveNeighboringWhitespaces(control: AbstractControl) {
    const value = control.value as string;
    const trimmedValue = value.trim();
    const trimmedValueWithoutNeighboringWhitespaces = trimmedValue.replace(/[\s]{2,}/g, ' ');
    control.patchValue(trimmedValueWithoutNeighboringWhitespaces);
  }

  removeAllWhitespaces(control: AbstractControl) {
    const value = control.value as string;
    const newValue = value.replace(/[\s]/g, '');
    control.patchValue(newValue);
  }

  trim(control: AbstractControl) {
    const value = control.value as string;
    const newValue = value.trim();
    control.patchValue(newValue);
  }
}
