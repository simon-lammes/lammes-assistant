import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {RegisterService, RegistrationResult} from './register.service';
import {ToastController} from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private registerService: RegisterService,
    private router: Router,
    private toastController: ToastController
  ) {
  }

  get showPassword(): boolean {
    return this.registerForm.value.showPassword;
  }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      showPassword: [false]
    });
  }

  async register() {
    const {firstName, lastName, username, password} = this.registerForm.value;
    const result = await this.registerService.register(firstName, lastName, username, password);
    switch (result) {
      case RegistrationResult.Success:
        await this.router.navigateByUrl('/tabs');
        break;
      case RegistrationResult.UsernameAlreadyUsed:
        await this.showHint('Username already in use.');
        break;
      case RegistrationResult.UnknownError:
        await this.showHint('Unknown error');
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
}
