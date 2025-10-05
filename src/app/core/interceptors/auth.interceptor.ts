import { HttpInterceptorFn, HttpRequest, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next) => {
  console.log('🌐 ========== HTTP INTERCEPTOR ==========');
  console.log('🌐 URL da requisição:', req.url);
  console.log('🌐 Método HTTP:', req.method);
  console.log('🇸 Headers originais:', req.headers);
  
  // Se já tem Authorization header, apenas passa adiante
  if (req.headers.has('Authorization')) {
    console.log('🌐 Authorization header já presente, passando adiante:', req.headers.get('Authorization'));
    console.log('🌐 ========== FIM INTERCEPTOR ==========');
    return next(req);
  }
  
  // Para rotas que precisam de autenticação, adicionar token do localStorage
  const token = localStorage.getItem('accessToken');
  console.log('🌐 Token do localStorage:', !!token);
  
  if (token && req.url.includes('/api/')) {
    console.log('🌐 Token encontrado, adicionando ao header para:', req.url);
    console.log('🌐 Token preview:', token.substring(0, 50) + '...');
    
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    console.log('🌐 Headers após adicionar Authorization:', clonedReq.headers);
    console.log('🌐 Authorization header específico:', clonedReq.headers.get('Authorization'));
    console.log('🌐 ========== FIM INTERCEPTOR ==========');
    return next(clonedReq);
  } else {
    console.log('🌐 Requisição para:', req.url);
    if (!token && req.url.includes('/api/users')) {
      console.log('🌐 ⚠️ Aviso: Tentativa de acessar usuários sem token!');
    }
  }
  
  console.log('🌐 ========== FIM INTERCEPTOR ==========');
  return next(req);
};