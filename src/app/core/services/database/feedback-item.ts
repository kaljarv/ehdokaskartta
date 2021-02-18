import type firebase from 'firebase';

export interface FeedbackItem {
  text: string,
  email?: string,
  route: string,
  matcherState?: any,
  sharedState?: any,
  timestamp?: firebase.firestore.Timestamp
}