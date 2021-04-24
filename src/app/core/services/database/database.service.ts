import { 
  Injectable
} from '@angular/core';
import { 
  take 
} from 'rxjs/operators';

import { 
  AngularFirestore,
  DocumentData,
  DocumentSnapshot,
  QuerySnapshot 
} from '@angular/fire/firestore';
import { 
  AngularFireAnalytics 
} from '@angular/fire/analytics';
import firebase from 'firebase/app';

import { 
  FeedbackItem 
} from './feedback-item';

import {
  Question,
  QuestionDict,
  QuestionLikert,
  QuestionLikertSeven,
  QuestionOpen,
  QuestionPreferenceOrder,
  QuestionOptions,
  QuestionOptionsPreferenceOrder,
  QuestionOptionsSingleNumber
} from './question';
import {
  AnswerDict,
  Candidate,
  CandidateDict,
  CandidateOptions
} from './candidate';
import {
  CategoryDict,
} from './category';
import {
  DEFAULT_CONSTITUENCY_ID,
  ConstituencyDict,
} from './constituency';
import {
  MunicipalityDict
} from './municipality';
import {
  Party,
  PartyDict,
  PartyOptions
} from './party';

export const ELECTION_ID = '2021-kuntavaalit-test'; // '2019-eduskuntavaalit';

export type QuestionType = 'Likert' | 'Likert7' | 'Open' | 'PreferenceOrder';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private _cache: {
    categories?: CategoryDict
    constituencies?: ConstituencyDict,
    parties?: PartyDict
  } = {};

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
  public async getCollectionOnce(path: string, where: [string, string, any] = null, andWhere: [string, string, any] = null): Promise<any> {
    // Wrap in a Promise
    return new Promise((resolve, reject) => {
      // Use where query if defined. Nb. we cannot use type here, as the matching type, Collection, is not exported
      const query = where ? this.dataRoot.collection(path.toString(), ref => andWhere ? ref.where(...where).where(...andWhere) : ref.where(...where) )
                          : this.dataRoot.collection(path.toString());
      query.get().pipe(take(1)).subscribe((res: QuerySnapshot<DocumentData>) => {
        // We expect a result
        if (res.empty)
          reject(`Couldn't retrieve collection '${path}' (where ${where ? where.join(' ') : '<none>'}) from database!`);
        // Map output to an object (possibly converting ids to numbers)
        let output = {};
        res.forEach(d => output[d.id] = d.data());
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
      // Enforce toString to ward off errors
      this.dataRoot.collection(collection.toString()).doc(document.toString()).get().pipe(take(1)).subscribe((res: DocumentSnapshot<DocumentData>) => {
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
  public async getMunicipalities(): Promise<MunicipalityDict> {
    return this.getCollectionOnce('municipalities');
  }

  public async getCategories(): Promise<CategoryDict> {
    const promise = this.getCollectionOnce('questionCategories');
    promise.then(data => this._cache.categories = data);
    return promise;
  }

  public async getConstituencies(): Promise<ConstituencyDict> {
    const promise = this.getCollectionOnce('constituencies');
    promise.then(data => this._cache.constituencies = data);
    return promise;
  }

  public async getParties(): Promise<PartyDict> {

    // Data converter
    // AngularFire doesn't implement the withConverter method, so we'll have to
    // process the data ourselves.
    const partyConverter = (data: PartyOptions): Party => new Party(data);

    // Return Promise
    return new Promise<PartyDict>(async (resolve, reject) => {
      const data = await this.getCollectionOnce('parties');
      const dict: PartyDict = {};
      for (const id in data)
        dict[id] = partyConverter(data[id]);
      this._cache.parties = dict;
      resolve(dict);
    });
  }

  public async getQuestions(constituencyId: string): Promise<QuestionDict> {
    // Get questions related to the chosen constituencyId or '-1', which is a special value denoting general
    // questions not related to any specific constituency.

    // We need these for the questions constructor
    if (this._cache.categories == null || this._cache.constituencies == null)
      throw new Error('Load cateories and constituencies before questions!');

    // Data converter
    // AngularFire doesn't implement the withConverter method, so we'll have to
    // process the data ourselves.
    const questionConverter = (data: any): Question => {
      // Get QuestionOptions from data by removing some properties
      const {filterable, type, ...opts} = data;
      // Add reference links
      opts.categoryReference = this._cache.categories;
      opts.constituencyReference = this._cache.constituencies;
      // Create object
      switch (type) {
        case "Likert":
          return new QuestionLikert(opts as QuestionOptionsSingleNumber);
        case "Likert7":
          return new QuestionLikertSeven(opts as QuestionOptionsSingleNumber);
        case "Open":
          return new QuestionOpen(opts as QuestionOptions);
        case "PreferenceOrder":
          return new QuestionPreferenceOrder(opts as QuestionOptionsPreferenceOrder);
        default:
          throw new Error(`Unknown question type '${type}'!`);
      }
    }

    // Return Promise
    return new Promise<QuestionDict>(async (resolve, reject) => {
      const data = await this.getCollectionOnce('questions', ['constituencyId', 'in', [constituencyId, DEFAULT_CONSTITUENCY_ID]], ['dropped', '==', false]);
      const dict: QuestionDict = {};
      for (const id in data)
        dict[id] = questionConverter(data[id]);
      resolve(dict);
    });
  }

  public async getCandidates(constituencyId: string): Promise<CandidateDict> {

    // We need these for the candidates constructor
    if (this._cache.parties == null)
      throw new Error('Load parties before candidates!');

    // Data converter
    // AngularFire doesn't implement the withConverter method, so we'll have to
    // process the data ourselves.
    const candidateConverter = (opts: any, id: string): Candidate => {
      // Add further data to options
      opts.constituencyId = constituencyId;
      opts.detailsLoader = (candidate: Candidate) => this.getCandidateDetails(candidate);
      opts.id = id;
      opts.partyReference = this._cache.parties;
      return new Candidate(opts as CandidateOptions);
    }

    // Return Promise
    return new Promise<CandidateDict>(async (resolve, reject) => {
      const data = await this.getCollectionOnce(`candidates/${constituencyId}/candidates`);
      const dict: CandidateDict = {};
      for (const id in data)
        dict[id] = candidateConverter(data[id], id);
      resolve(dict);
    });
  }

  public async getCandidateDetails(candidate: Candidate): Promise<AnswerDict> {
    return this.getDocumentOnce(`candidateDetails/${candidate.constituencyId}/candidates`, candidate.id);
  }

  public async getCorrelationMatrix(constituencyId: string): Promise<any> {
    return this.getDocumentOnce('pcm-matrices', constituencyId);
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
