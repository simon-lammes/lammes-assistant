import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LabelSelectorComponent} from './label-selector/label-selector.component';
import {IonicModule} from '@ionic/angular';
import {LabelSelectorModalComponent} from './label-selector/label-selector-modal/label-selector-modal.component';
import {UserSelectorComponent} from './user-selector/user-selector.component';
import {UserSelectorModalComponent} from './user-selector/user-selector-modal/user-selector-modal.component';
import {ReactiveFormsModule} from '@angular/forms';
import {ValidationFeedbackComponent} from './validation-feedback/validation-feedback.component';
import {IonInputFocusDirective} from './directives/ion-input-focus.directive';
import {TranslateModule} from '@ngx-translate/core';


@NgModule({
  declarations: [
    LabelSelectorComponent,
    LabelSelectorModalComponent,
    UserSelectorComponent,
    UserSelectorModalComponent,
    ValidationFeedbackComponent,
    IonInputFocusDirective
  ],
  exports: [
    LabelSelectorComponent,
    UserSelectorComponent,
    ValidationFeedbackComponent,
    IonInputFocusDirective,
    TranslateModule
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    TranslateModule
  ]
})
export class SharedModule { }
