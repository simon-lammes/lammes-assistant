import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {LoginResult, LoginService} from './login.service';
import {ToastController} from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private toastController: ToastController
  ) {
  }

  get showPassword(): boolean {
    return this.loginForm.value.showPassword;
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      showPassword: [false]
    });
  }

  async login() {
    const {username, password} = this.loginForm.value;
    const result = await this.loginService.login(username, password);
    switch (result) {
      case LoginResult.Success:
        await this.router.navigateByUrl('/tabs');
        break;
      case LoginResult.UserDoesNotExist:
        await this.showHint('User does not exist.');
        break;
      case LoginResult.WrongPassword:
        await this.showHint('Wrong password');
        break;
      case LoginResult.UnknownError:
        await this.showHint('Unknown error during login');
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
