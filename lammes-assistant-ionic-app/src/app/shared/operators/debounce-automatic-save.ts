import {Observable} from 'rxjs';
import {ApplicationConfiguration} from '../services/application-configuration/application-configuration.service';
import {debounceTime} from 'rxjs/operators';

/**
 * Makes sure that automatic saves are debounced as configured in the application configuration
 */
export function debounceAutomaticSave(applicationConfiguration: ApplicationConfiguration) {
  return <T>(source: Observable<T>) => {
    return source.pipe(
      debounceTime(applicationConfiguration.automaticSaveDebounceMillis)
    );
  };
}
