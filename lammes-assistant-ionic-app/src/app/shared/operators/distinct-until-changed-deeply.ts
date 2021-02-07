import {Observable} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';
import _ from 'lodash/fp';

/**
 * Like RxJS distinctUntilChanged but makes a deep comparison instead of a comparison by reference.
 */
export function distinctUntilChangedDeeply() {
  return <T>(source: Observable<T>): Observable<T> => {
    return source.pipe(
      distinctUntilChanged((x, y) => _.isEqual(x, y))
    );
  };
}
