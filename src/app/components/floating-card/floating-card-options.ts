import {
  InjectionToken,
  Type 
} from '@angular/core';
import { 
  ANIMATION_DURATION_MS,
  ANIMATION_TIMING 
} from '../../core';


export interface FloatingCardConfig {
  type: Type<any>;
  data?: any;
  options?: FloatingCardOptions;
}

export interface FloatingCardOptions {
  panelClass?: string;
  hiddenWhenOpened?: boolean;
  minimisedHeight?: string;
  landscapeBreakpointPx?: number;
  landscapeMargin?: string;
}

export interface FloatingCardPeekElementOptions {
  offset?: string;
  dontPeek?: boolean;
  persistentHeight?: boolean;
}

export enum FloatingCardState {
  Hidden,
  Peeking,
  Maximised,
  Dismissed,
};

export type PositionStrategyType = 'closed' | 'hidden' | 'minimised' | 'maximised' | 'peek';

export const FLOATING_CARD_DATA = new InjectionToken<any>('FLOATING_CARD_DATA');

export const FLOATING_CARD_PANEL_CLASS = 'floatingCard-panel';

export const FLOATING_CARD_INITIALISED_CLASS = FLOATING_CARD_PANEL_CLASS + '--initialised';

export const FLOATING_CARD_MAXIMISED_CLASS = FLOATING_CARD_PANEL_CLASS + '--maximised';

export const FLOATING_CARD_DEFAULT_PEEK_HEIGHT: string = '6rem';

export const FLOATING_CARD_ANIMATION_DURATION_MS = ANIMATION_DURATION_MS;

export const FLOATING_CARD_ANIMATION_TIMING = ANIMATION_TIMING;

export const DEFAULT_FLOATING_CARD_OPTIONS: FloatingCardOptions = {
  hiddenWhenOpened: false,
  minimisedHeight: '6rem',
  landscapeBreakpointPx: 900,
  // This should match the top bar margins
  landscapeMargin: '1rem'
}

export const DEFAULT_FLOATING_CARD_PEEK_ELEMENT_OPTIONS: FloatingCardPeekElementOptions = {
  offset: null,
  dontPeek: false,
  persistentHeight: false,
}