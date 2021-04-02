export class FetchFilteredNotes {
  public static readonly type = '[Notes] Fetch Filtered Notes';
  constructor(public filter: any) { }
}
