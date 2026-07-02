import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule
}
    from '@angular/forms';

import { AuthService }
    from '../../../core/services/auth.service';

import { Router } 
from '@angular/router'; 

@Component({
    selector: 'app-login',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})

export class LoginComponent {
    loginForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {

        this.loginForm = this.fb.group({
            email: [
                '',
                [
                    Validators.required,
                    Validators.email
                ]
            ],
            password: [
                '',
                [
                    Validators.required
                ]
            ]
        });
    }

    onSubmit(): void {
        if (
            this.loginForm.invalid
        ) {
            return;
        }
        const {
            email,
            password
        } = this.loginForm.value;
        this.authService.login(
            email,
            password
        ).subscribe({
            next: (response) => {
                console.log(
                    'LOGIN EXITOSO'
                );

                this.authService.saveSession(response);
                this.router.navigate(['/dashboard']);
                console.log(response);
            },
            error: (error) => {
                console.error(
                    'ERROR LOGIN'
                );
                console.error(error);
            }
        });
    }

}