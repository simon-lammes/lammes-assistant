import {Storage} from '@ionic/storage';
import {AsyncStorageEngine} from '@ngxs-labs/async-storage-plugin';
import {from, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IonicStorageEngine implements AsyncStorageEngine {

  constructor(
    private storage: Storage
  ) {
  }

  length(): Observable<number> {
    return from(this.storage.length());
  }

  getItem(key: string): Observable<any> {
    return from(this.storage.get(key));
  }

  async setItem(key: string, value: any): Promise<void> {
    await this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.storage.remove(key);
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }

  key(index: number): Observable<string> {
    return from(this.storage.keys()).pipe(
      map(keys => keys[index])
    );
  }
}
