import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserSyncService } from './core/services/user-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: []
})
export class AppComponent implements OnInit {
  title = 'CAD+ ERP - Sistema de Gestão Hospitalar';

  constructor(private userSyncService: UserSyncService) {}

  ngOnInit(): void {
    // Sincronizar dados do usuário na inicialização da aplicação
    this.userSyncService.syncCurrentUser();
  }
}
