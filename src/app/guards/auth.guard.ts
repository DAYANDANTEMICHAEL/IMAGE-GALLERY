// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private router: Router) { }

    // Check if the user is logged in
    isLoggedIn(): boolean {
        return !!localStorage.getItem('authToken'); // Ensure token exists
    }

    canActivate(): boolean {
        console.log('Checking authentication...');
        if (this.isLoggedIn()) {
            console.log('User is logged in.');
            return true; // Allow access if logged in
        } else {
            console.log('User is not logged in. Redirecting to login.');
            this.router.navigate(['/login']); // Redirect to login if not logged in
            return false;
        }
    }
}
