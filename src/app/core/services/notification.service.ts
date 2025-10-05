import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationConfig {
  message: string;
  type?: NotificationType;
  duration?: number;
  action?: string;
  position?: MatSnackBarConfig['verticalPosition'];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  private readonly defaultDuration = 5000;
  private readonly defaultPosition: MatSnackBarConfig['verticalPosition'] = 'bottom';

  constructor(private snackBar: MatSnackBar) {}

  show(config: NotificationConfig): void {
    const snackBarConfig: MatSnackBarConfig = {
      duration: config.duration ?? this.defaultDuration,
      verticalPosition: config.position ?? this.defaultPosition,
      panelClass: this.getPanelClass(config.type ?? 'info'),
    };

    this.snackBar.open(config.message, config.action || 'Fechar', snackBarConfig);
  }

  showSuccess(message: string, config?: Partial<NotificationConfig>): void {
    this.show({
      message,
      type: 'success',
      ...config
    });
  }

  showError(message: string, config?: Partial<NotificationConfig>): void {
    this.show({
      message,
      type: 'error',
      duration: 0, // Erro não deve sumir automaticamente
      ...config
    });
  }

  showWarning(message: string, config?: Partial<NotificationConfig>): void {
    this.show({
      message,
      type: 'warning',
      ...config
    });
  }

  showInfo(message: string, config?: Partial<NotificationConfig>): void {
    this.show({
      message,
      type: 'info',
      ...config
    });
  }

  private getPanelClass(type: NotificationType): string[] {
    const baseClass = 'notification';
    
    switch (type) {
      case 'success':
        return [baseClass, 'notification-success'];
      case 'error':
        return [baseClass, 'notification-error'];
      case 'warning':
        return [baseClass, 'notification-warning'];
      case 'info':
        return [baseClass, 'notification-info'];
      default:
        return [baseClass];
    }
  }

  dismiss(): void {
    this.snackBar.dismiss();
  }
}
