import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from
'../../../environments/environment';
import { AuthResponse }
from '../../shared/interfaces/auth-response.interface';
@Injectable({
 providedIn: 'root'
})
export class AuthService {
 private apiUrl = environment.apiUrl;
 constructor(
 private http: HttpClient
 ) { }
 /*
 Login
 */
 login(
 email: string,
 password: string
 ): Observable<AuthResponse> {
 return this.http.post<AuthResponse>(
 `${this.apiUrl}/auth/login`,
 {
 email,
 password
 }
 );
 }

 saveSession(response: any): void { 
 localStorage.setItem( 
 'accessToken', 
 response.token 
 ); 
 localStorage.setItem( 
 'refreshToken', 
 response.refreshToken 
 ); 
 localStorage.setItem( 
 'user', 
 JSON.stringify(response.usuario) 
 ); 
}

getAccessToken(): string | null { 
 return localStorage.getItem( 
 'accessToken' 
 ); 
} 

getUser(): any { 
 const user = 
 localStorage.getItem('user'); 
 return user 
 ? JSON.parse(user) 
 : null; 
}

logout(): void { 
 localStorage.removeItem( 
 'accessToken' 
 ); 
 localStorage.removeItem( 
 'refreshToken' 
 ); 
 localStorage.removeItem( 
 'user' 
 ); 
} 

/* 
 Verificar si existe una sesión activa 
*/ 
isAuthenticated(): boolean { 
 return this.getAccessToken() !== null; 
} 

/* 
 Actualizar únicamente el Access Token 
*/ 
updateAccessToken( 
 accessToken: string 
): void { 
 localStorage.setItem( 
 'accessToken', 
 accessToken 
 ); 
}

/* 
 Obtener Refresh Token 
*/ 
getRefreshToken(): string | null { 
 return localStorage.getItem( 
 'refreshToken' 
 ); 
} 

/* 
 Solicitar un nuevo Access Token 
*/ 
refreshAccessToken() { 
 return this.http.post( 
 `${this.apiUrl}/auth/refresh-token`, 
 { 
 refreshToken: 
 this.getRefreshToken() 
 } 
 ); 
}

}