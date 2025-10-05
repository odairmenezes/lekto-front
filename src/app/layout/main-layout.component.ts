import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';

import { AuthService } from '../core/services/auth.service';
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Angular Material imports
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentUser: User | null = null;
  isMobile = false;
  sidebarOpen = true;

  navigationItems = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Usuários',
      icon: 'people',
      route: '/users'
    },
    {
      label: 'Contato',
      icon: 'support_agent',
      route: '/contact'
    },
    {
      label: 'Meu Perfil',
      icon: 'person',
      route: '/profile'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.setupResponsiveBehavior();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    console.log('👤 Carregando usuário atual no MainLayout...');
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        console.log('👤 Usuário carregado no MainLayout:', user);
        this.currentUser = user;
      });
  }

  private setupResponsiveBehavior(): void {
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small
    ]).pipe(
      map(result => result.matches),
      takeUntil(this.destroy$)
    ).subscribe(isMobile => {
      this.isMobile = isMobile;
      if (isMobile) {
        this.sidebarOpen = false;
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onNavigationItemClick(route: string): void {
    console.log('🔗 BOTÃO CLICADO! Navegando para:', route);
    console.log('🔗 Usuário atual:', this.currentUser);
    this.router.navigate([route]);
    
    // Close sidebar on mobile after navigation
    if (this.isMobile) {
      this.sidebarOpen = false;
    }
  }

  goToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  onLogout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }

  getUserInitials(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }
}
