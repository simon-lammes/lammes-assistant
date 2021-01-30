import {Directive, ElementRef} from '@angular/core';

/**
 * Focuses an ion input as soon as it is created. In contrast to the autofocus attribute, this
 * should also work when already another element is currently being focused.
 */
@Directive({
  selector: '[appIonInputFocus]'
})
export class IonInputFocusDirective {

  constructor(
    private elementRef: ElementRef
  ) {
    window.setTimeout(() => {
      elementRef.nativeElement.setFocus();
      // In my opinion, this should work with a timeout of 0, but somehow it does not.
      // I found no other solution so far. Inspired by:
      // https://forum.ionicframework.com/t/focus-method-doesnt-work-on-input-textarea-etc/5606/5
    }, 600);
  }

}
