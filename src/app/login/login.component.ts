// login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { AuthGuard } from '../guards/auth.guard';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatProgressSpinnerModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private authGuard: AuthGuard) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], 
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  login() {
    this.errorMessage = null;
    this.http.post('http://localhost/IMAGE-GALLERY/backend/login.php', this.loginForm.value, { responseType: 'text' })
    .subscribe((response: any) => {
        try {
            const jsonResponse = JSON.parse(response);
            if (jsonResponse.success) {
                localStorage.setItem('userId', jsonResponse.userId);
                localStorage.setItem('email', this.loginForm.value.email);
                localStorage.setItem('authToken', jsonResponse.token);
                console.log("Navigating to dashboard...");
                this.router.navigate(['/dashboard']);
            } else {
                this.errorMessage = jsonResponse.error;
            }
        } catch (e) {
            this.errorMessage = "Server returned an invalid response. Please check server logs.";
        }
    }, error => {
        this.errorMessage = error.error ? error.error : 'Login failed. Please try again later.';
    });
  }
}
