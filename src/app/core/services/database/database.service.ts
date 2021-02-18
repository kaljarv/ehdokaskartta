import { Injectable } from '@angular/core';
import { take } from 'rxjs/operators';

import { AngularFirestore,
         DocumentData,
         DocumentSnapshot,
         QuerySnapshot } from '@angular/fire/firestore';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import firebase from 'firebase/app';

import { FeedbackItem } from './feedback-item';

export const ELECTION_ID = '2019-eduskuntavaalit';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(
    private firestore: AngularFirestore,
    private analytics: AngularFireAnalytics,
  ) {}

  get dataRoot(): any {
    return this.firestore.collection('data').doc(ELECTION_ID);
  }

  /*
   * Get a data collection as an object once, ie. not as an Observable,
   * Firestore.collection() returns an Observable and we are not interested in changes,
   * thus we need to use take(1) to get only the a snapshot.
   * Supports to chained where clauses in a very unelegant manner ;)
   */
  public async getCollectionOnce(path: string, numericId: boolean = false, where: [string, string, any] = null, andWhere: [string, string, any] = null): Promise<any> {
    // Wrap in a Promise
    return new Promise((resolve, reject) => {
      // Use where query if defined
      const query = where ? this.dataRoot.collection(path, ref => andWhere ? ref.where(...where).where(...andWhere) : ref.where(...where) ) 
                          : this.dataRoot.collection(path);
      // Get a snapshot with take(1)
      query.get().pipe(take(1)).subscribe((res: QuerySnapshot<DocumentData>) => {
        // We expect a result
        if (res.empty)
          reject(`Couldn't retrieve collection '${path}' (where ${where ? where.join(' ') : '<none>'}) from database!`);
        // Map output to an object (possibly converting ids to numbers)
        let output = {};
        res.forEach(d => output[numericId ? Number(d.id) : d.id] = d.data());
        // Return ie. resolve with the object
        // console.log(path, output);
        resolve(output);
      });
    });
  }

  /*
   * Get a data document as an object once, ie. not as an Observable,
   */
  public async getDocumentOnce(collection: string, document: string): Promise<any> {
    // Wrap in a Promise
    return new Promise((resolve, reject) => {
      // Get a snapshot with take(1)
      this.dataRoot.collection(collection).doc(document).get().pipe(take(1)).subscribe((res: DocumentSnapshot<DocumentData>) => {
        // We expect a result
        if (!res.exists)
          reject(`Couldn't retrieve document '${collection}/${document}' from database!`);
        resolve(res.data());
      });
    });
  }

  /*
   * Shorthand methods for gettings specific collections (once)
   */
  public async getMunicipalities(): Promise<any> {
    return this.getCollectionOnce('municipalities', true);
  }

  public async getConstituencies(): Promise<any> {
    return this.getCollectionOnce('constituencies', true);
  }

  public async getQuestions(constituencyId: number): Promise<any> {
    // Get questions related to the chosen constituencyId or -1, which is a special value denoting general
    // questions not related to any specific constituency. NB. ids are not numeric!
    return this.getCollectionOnce('questions', false, ['constituencyId', 'in', [constituencyId, -1]], ['dropped', '==', false]);
  }

  public async getCandidates(constituencyId: number): Promise<any> {
    // NB. ids are not numeric!
    return this.getCollectionOnce('candidates', false, ['constituencyId', '==', constituencyId]);
  }

  public async getCorrelationMatrix(constituencyId: number): Promise<any> {
    // NB. ids are not numeric!
    return this.getDocumentOnce('pcm-matrices', constituencyId.toString());
  }

  /*
   * Save user feedback
   */
  public saveFeedback(doc: FeedbackItem, onSuccess?: (docRef) => void, onError?: (error) => void ): void {
    const collection = this.firestore.collection('feedback').doc(ELECTION_ID).collection('open-feedback');
    collection.add({
      ...this._sanitize(doc),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      userAgent: this._sanitize(navigator.userAgent),
    })
    .then( docRef => {
      if (onSuccess) 
        onSuccess(docRef);
    })
    .catch( error => {
      if (onError) 
        onError(error);
    });
  }

  /*
   * Clean up data for firestore, converting undefineds to nulls
   */
  private _sanitize(doc: any): any {
    if (doc == null) {
      return null;
    } else if (typeof doc === 'object') {
      let clean = {};
      for (let k in doc) {
        clean[k] = this._sanitize(doc[k]);
      }
      return clean;
    } else {
      return doc;
    }
  }

  /*
   * Log any event for analytics
   */
  public logEvent(eventName: string, eventParams: any = {}): void {
    this.analytics.logEvent(eventName, eventParams);
    // console.log(eventName, eventParams);
  }

}
