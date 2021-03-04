import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LabelSelectorComponent} from './components/label-selector/label-selector.component';
import {IonicModule} from '@ionic/angular';
import {LabelSelectorModalComponent} from './components/label-selector/label-selector-modal/label-selector-modal.component';
import {UserSelectorComponent} from './components/user-selector/user-selector.component';
import {UserSelectorModalComponent} from './components/user-selector/user-selector-modal/user-selector-modal.component';
import {ReactiveFormsModule} from '@angular/forms';
import {ValidationFeedbackComponent} from './components/validation-feedback/validation-feedback.component';
import {IonInputFocusDirective} from './directives/ion-input-focus.directive';
import {TranslateModule} from '@ngx-translate/core';
import {GroupSelectComponent} from './components/group-select/group-select.component';
import {GroupSelectModalComponent} from './components/group-select/group-select-modal/group-select-modal.component';


@NgModule({
  declarations: [
    LabelSelectorComponent,
    LabelSelectorModalComponent,
    UserSelectorComponent,
    UserSelectorModalComponent,
    ValidationFeedbackComponent,
    IonInputFocusDirective,
    GroupSelectComponent,
    GroupSelectModalComponent
  ],
  exports: [
    LabelSelectorComponent,
    UserSelectorComponent,
    ValidationFeedbackComponent,
    IonInputFocusDirective,
    TranslateModule,
    GroupSelectComponent,
    IonicModule
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    TranslateModule
  ]
})
export class SharedModule { }
