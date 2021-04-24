import {
  Question
} from './question';

export interface GetAnswer {
  getAnswer: (question: string | Question) => any;
}