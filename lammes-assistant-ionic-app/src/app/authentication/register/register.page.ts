import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {RegisterService, RegistrationResult} from '../../shared/services/register/register.service';
import {ToastController} from '@ionic/angular';
import {CustomFormsService} from '../../shared/services/custom-forms.service';
import {ApplicationConfigurationService} from '../../shared/services/application-configuration/application-configuration.service';
import {distinctUntilChanged, first, startWith, switchMap} from 'rxjs/operators';
import {ValidationAspect} from '../../shared/components/validation-feedback/validation-feedback.component';
import {Observable} from 'rxjs';
import _ from 'lodash';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  validationFeedback$: Observable<ValidationAspect[]>;

  constructor(
    private formBuilder: FormBuilder,
    private registerService: RegisterService,
    private router: Router,
    private toastController: ToastController,
    private customFormsService: CustomFormsService,
    private applicationConfigurationService: ApplicationConfigurationService,
    private translateService: TranslateService
  ) {
  }

  get showPassword(): boolean {
    return this.registerForm.value.showPassword;
  }

  async ngOnInit() {
    const configuration = await this.applicationConfigurationService.applicationConfiguration$.pipe(first()).toPromise();
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', Validators.required],
      password: this.formBuilder.control('', [Validators.required, Validators.minLength(configuration.minPasswordLength)]),
      showPassword: [false]
    });
    this.validationFeedback$ = this.registerForm.valueChanges.pipe(
      startWith(this.registerForm.value as {}),
      switchMap(async () => {
        const passwordControl = this.registerForm.controls.password;
        return [
          {
            description: await this.translateService.get('messages.min-password-length', {
              minPasswordLength: configuration.minPasswordLength
            }).toPromise(),
            valid: !passwordControl.hasError('required') && !passwordControl.hasError('minlength')
          } as ValidationAspect
        ];
      }),
      distinctUntilChanged((x, y) => _.isEqual(x, y))
    );
  }

  async register() {
    // The following check is really necessary because it is hard to make sure this method is only callable when registerForm is valid.
    // Only remove if you are sure that you guarantee it.
    if (this.registerForm.invalid) {
      return;
    }
    const {firstName, lastName, username, password} = this.registerForm.value;
    const result = await this.registerService.register(firstName, lastName, username, password);
    switch (result) {
      case RegistrationResult.Success:
        await this.router.navigateByUrl('/tabs');
        break;
      case RegistrationResult.UsernameAlreadyUsed:
        await this.showHint(await this.translateService.get('messages.username-in-use').toPromise());
        break;
      case RegistrationResult.UnknownError:
        await this.showHint(await this.translateService.get('messages.unknown-error').toPromise());
        break;
    }
  }

  private async showHint(message: string) {
    const toast = await this.toastController.create({
      header: message,
      duration: 5000,
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

  trim(formControlName: string) {
    const formControl = this.registerForm.controls[formControlName];
    this.customFormsService.trimAndRemoveNeighboringWhitespaces(formControl);
  }

  removeAllWhitespaces(formControlName: string) {
    const formControl = this.registerForm.controls[formControlName];
    this.customFormsService.removeAllWhitespaces(formControl);
  }
}
