import {combineLatest, interval, Observable} from 'rxjs';
import {ApplicationConfiguration} from '../services/application-configuration/application-configuration.service';
import {debounce, map} from 'rxjs/operators';

/**
 * Makes sure that automatic saves are debounced as configured in the application configuration
 */
export function debounceAutomaticSave(applicationConfiguration$: Observable<ApplicationConfiguration>) {
  return <T>(source: Observable<T>): Observable<T> => {
    return combineLatest([
      source,
      applicationConfiguration$
    ]).pipe(
      debounce(([, config]) => interval(config.automaticSaveDebounceMillis)),
      map(([sourceValue]) => sourceValue)
    );
  };
}
