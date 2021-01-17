import {Injectable} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map} from 'rxjs/operators';

export interface Label {
  id: number;
  title: string;
}

const labelFragment = gql`
    fragment LabelFragment on Label {
        id,
        title
    }
`;

const myFavoriteLabelsQuery = gql`
    query MyFavoriteLabels {
        myFavoriteLabels {
            ...LabelFragment
        }
    },
    ${labelFragment}
`;

@Injectable({
  providedIn: 'root'
})
export class LabelsService {

  readonly usersFavoriteLabels$ = this.apollo.watchQuery<{ myFavoriteLabels: Label[] }>({query: myFavoriteLabelsQuery}).valueChanges.pipe(
    map(({data}) => data.myFavoriteLabels)
  );

  constructor(
    private apollo: Apollo
  ) { }
}
