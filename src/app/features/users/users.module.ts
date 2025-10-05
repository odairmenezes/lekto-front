import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/user-list/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./components/user-details/user-details.component').then(m => m.UserDetailsComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersModule { }