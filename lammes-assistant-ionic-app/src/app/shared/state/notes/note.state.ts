import {Action, Selector, State, StateContext} from '@ngxs/store';
import {FetchFilteredNotes} from './notes.actions';
import {Injectable} from '@angular/core';
import {switchMap, tap} from 'rxjs/operators';
import {Note, NoteService} from '../../services/note/note.service';
import {of} from 'rxjs';
import {debounceFilterQuery} from '../../operators/debounce-filter-query';
import {ApplicationConfigurationService} from '../../services/application-configuration/application-configuration.service';

export interface NoteStateModel {
  filteredNotes: Note[];
  isLoading: boolean;
}

@State<NoteStateModel>({
  name: 'note',
  defaults: {
    filteredNotes: [],
    isLoading: false
  }
})
@Injectable()
export class NoteState {
  @Selector()
  public static filteredNotes(state: NoteStateModel) {
    return state.filteredNotes;
  }

  @Selector()
  public static isLoading(state: NoteStateModel) {
    return state.isLoading;
  }

  constructor(
    private noteService: NoteService,
    private applicationConfigurationService: ApplicationConfigurationService
  ) {
  }


  @Action(FetchFilteredNotes, {cancelUncompleted: true})
  public fetchFilteredNotes(ctx: StateContext<NoteStateModel>, {filter}: FetchFilteredNotes) {
    return of(null).pipe(
      tap(() => ctx.patchState({isLoading: true})),
      debounceFilterQuery(this.applicationConfigurationService.applicationConfiguration$),
      switchMap(() => this.noteService.fetchFilteredNotes(filter)),
      tap(filteredNotes => ctx.patchState({filteredNotes, isLoading: false}))
    );
  }
}
