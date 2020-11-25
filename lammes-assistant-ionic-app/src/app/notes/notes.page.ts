import {Component, OnInit} from '@angular/core';
import {Note, NotesService} from './notes.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
})
export class NotesPage implements OnInit {
  notes$: Observable<Note[]>;

  constructor(
    private notesService: NotesService
  ) { }

  ngOnInit() {
    this.notes$ = this.notesService.usersNotes$;
  }

}
