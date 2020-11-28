import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditNotePage } from './edit-note.page';

const routes: Routes = [
  {
    path: ':noteId',
    component: EditNotePage
  },
  {
    path: '**',
    redirectTo: '/tabs/notes'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditNotePageRoutingModule {}
