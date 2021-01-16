import {Injectable} from '@angular/core';
import {AbstractControl} from '@angular/forms';

/**
 * A service providing general-purpose functionality in the context of forms.
 */
@Injectable({
  providedIn: 'root'
})
export class CustomFormsServiceService {

  /**
   * Trims the input of the user and makes sure that whitespaces are not next to each other: 'a   b' becomes 'a b'.
   */
  trimAndRemoveNeighboringWhitespaces(control: AbstractControl) {
    const value = control.value as string;
    const trimmedValue = value.trim();
    const trimmedValueWithoutNeighboringWhitespaces = trimmedValue.replace(/[\s]{2,}/g, ' ');
    control.patchValue(trimmedValueWithoutNeighboringWhitespaces);
  }
}
