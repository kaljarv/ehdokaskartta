import * as firebase from 'firebase/app';
import 'firebase/firestore';

export interface FeedbackItem {
  text: string,
  email?: string,
  route: string,
  matcherState?: any,
  sharedState?: any,
  timestamp?: firebase.firestore.Timestamp
}