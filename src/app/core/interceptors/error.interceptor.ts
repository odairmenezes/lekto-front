import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  
  constructor(private notificationService: NotificationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.handleError(error, req.url);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse, url: string): void {
    let errorMessage = 'Ocorreu um erro inesperado';
    let errorType: 'error' | 'warning' = 'error';

    if (error.error instanceof ErrorEvent) {
      // Erro do cliente
      errorMessage = error.error.message;
    } else {
      // Erro do servidor
      const { status, error: errorBody } = error;
      
      switch (status) {
        case 400:
          errorMessage = this.extractErrorMessage(errorBody) || 'Dados inválidos';
          errorType = 'warning';
          break;
        case 401:
          // Não mostrar notificação para 401 aqui, pois é tratado no AuthInterceptor
          return;
        case 403:
          errorMessage = 'Acesso negado';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado';
          break;
        case 409:
          errorMessage = this.extractErrorMessage(errorBody) || 'Conflito de dados';
          errorType = 'warning';
          break;
        case 422:
          errorMessage = this.extractErrorMessage(errorBody) || 'Dados inválidos para processamento';
          errorType = 'warning';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor';
          break;
        case 503:
          errorMessage = 'Serviço temporariamente indisponível';
          break;
        default:
          errorMessage = this.extractErrorMessage(errorBody) || errorMessage;
      }
    }

    this.notificationService.show({
      message: errorMessage,
      type: errorType,
      duration: errorType === 'error' ? 0 : undefined // Erros críticos não somem automaticamente
    });
  }

  private extractErrorMessage(errorBody: any): string | null {
    if (typeof errorBody === 'string') {
      return errorBody;
    }
    
    if (errorBody && typeof errorBody === 'object') {
      // Tentar algumas propriedades comuns
      if (errorBody.message) {
        return errorBody.message;
      }
      if (errorBody.error) {
        return errorBody.error;
      }
      if (errorBody.details) {
        return errorBody.details;
      }
      if (errorBody.errors && Array.isArray(errorBody.errors)) {
        return errorBody.errors.join('; ');
      }
    }
    
    return null;
  }
}
