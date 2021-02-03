import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

export interface Label {
  id: string;
  title: string;
}

export interface LabelFilter {
  query?: string;
}

const labelFragment = gql`
  fragment LabelFragment on Label {
    id,
    title
  }
`;

const labelRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const matchGroupsOfOneOrMoreWhitespacesAndDashes = /[\s-]+/g;
const matchAnythingOtherThanDigitsAndLowercaseCharactersAndDashes = /[^a-z0-9-]/g;

@Injectable({
  providedIn: 'root'
})
export class LabelService {

  constructor(
    private apollo: Apollo
  ) { }

  /**
   * This converts the user input to a valid label. This way, the users query can be converted into a new label.
   */
  validLabelFromFilterQuery(filterQuery: string) {
    const label = filterQuery
      .trim()
      .toLowerCase()
      .replace(matchGroupsOfOneOrMoreWhitespacesAndDashes, '-')
      .replace(matchAnythingOtherThanDigitsAndLowercaseCharactersAndDashes, '');
    // Label should be valid but we program defensively and test it.
    const isLabelValid = labelRegex.test(label);
    if (isLabelValid) {
      return label;
    } else {
      return undefined;
    }
  }

  getFilteredLabels(filter: LabelFilter): Observable<string[]> {
    return this.apollo.watchQuery<{filteredLabels: Label[]}>({
      query: gql`
        query FilteredLabels($query: String) {
          filteredLabels(query: $query) {
            ...LabelFragment
          }
        },
        ${labelFragment}
      `,
      variables: filter
    }).valueChanges.pipe(
      map(result => result.data?.filteredLabels.map(label => label.title))
    );
  }
}
