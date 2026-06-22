import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ServiceResponse } from '../../models/ServiceResponse';
import { TokenModel } from '../../models/User';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  signUpForm: FormGroup;
  showPassword = false;
  Dir: string = 'ltr';
  isSignUp: boolean = false;

  constructor(
    private _router: Router,
    private fb: FormBuilder,
    private _route: ActivatedRoute,
    private _authService: AuthService,
    private _toastService : ToastService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false],
    });

    this.signUpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false],
    });
  }

  ngOnInit() {
    this.Dir = localStorage.getItem('app-dir') || 'ltr';
    this._route.queryParams.subscribe((params) => {
      if (params['redirectResponse']) {
        let redirectResponse = this.toCamelCase(
          JSON.parse(params['redirectResponse'])
        ) as ServiceResponse<TokenModel>;
        const tokenData = redirectResponse.data;
        if (this._authService.isTokenValid(tokenData)) {
          this._authService.accessToken = tokenData;
          this._router.navigate(['/land']);
        } else {
          this._toastService.alert(false, 'Token is invalid or expired.')
          this._router.navigate(['/login']);
        }
      }
    });
  }
  toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        acc[camelKey] = this.toCamelCase(obj[key]);
        return acc;
      }, {} as any);
    }
    return obj;
  }
  toggleForm(event: Event) {
    event.preventDefault();
    this.isSignUp = !this.isSignUp;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this._authService.login(email, password).subscribe({
        next: (res) => {
          const response = this.toCamelCase(res) as ServiceResponse<TokenModel>;
          const tokenData = response?.data;
          if (response?.success && tokenData && this._authService.isTokenValid(tokenData)) {
            this._authService.accessToken = tokenData;
            this._router.navigate(['/land']);
          } else {
            this._toastService.alert(false, response?.message || 'Invalid email or password.');
          }
        },
        error: () => this._toastService.alert(false, 'Login failed. Please try again.'),
      });
    }
  }

  signInWithGoogle(): void {
    this._authService.loginWithGoogle();
  }
  signInWithFacebook(): void {
    this._authService.loginWithFacebook();
  }
  signInWithMicrosoft(): void {
    this._authService.loginWithMicrosoft();
  }
}
