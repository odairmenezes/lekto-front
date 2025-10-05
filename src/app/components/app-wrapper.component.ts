import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { MainLayoutComponent } from '../layout/main-layout.component';
import { AuthLayoutComponent } from '../layout/auth-layout.component';

@Component({
  selector: 'app-wrapper',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, AuthLayoutComponent],
  template: `
    <app-main-layout *ngIf="showMainLayout"></app-main-layout>
    <app-auth-layout *ngIf="!showMainLayout"></app-auth-layout>
  `,
  styleUrls: []
})
export class AppWrapperComponent implements OnInit {
  showMainLayout = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      this.updateLayout();
    });
    
    this.updateLayout();
  }

  private updateLayout(): void {
    const url = this.router.url;
    const isAuthRoute = url.startsWith('/auth');
    
    this.showMainLayout = !isAuthRoute && this.authService.isLoggedIn();
  }
}
