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
  minimisedHeight?: number;
  landscapeBreakpoint?: number;
  landscapeMarginLeft?: number;
  landscapeMarginTop?: number;
}

export interface FloatingCardPeekElementOptions {
  offset?: number;
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

export const FLOATING_CARD_ANIMATION_DURATION_MS = ANIMATION_DURATION_MS;

export const FLOATING_CARD_ANIMATION_TIMING = ANIMATION_TIMING;

export const FLOATING_CARD_CLICK_CANCEL_DURATION = 300; // ms

export const FLOATING_CARD_CLOSE_DELAY = 500; // ms to allow for transitioning at close before disposing overlay

export const FLOATING_CARD_DATA = new InjectionToken<any>('FLOATING_CARD_DATA');

export const FLOATING_CARD_DEFAULT_PEEK_HEIGHT: number = 6 * 16;

export const FLOATING_CARD_MAX_WIDTH_PORTRAIT: string = '42rem';

export const FLOATING_CARD_MAX_WIDTH_LANDSCAPE: string = `min(50vw, ${FLOATING_CARD_MAX_WIDTH_PORTRAIT})`;

export const FLOATING_CARD_PANEL_CLASS = 'floatingCard-panel';

export const FLOATING_CARD_INITIALISED_CLASS = FLOATING_CARD_PANEL_CLASS + '--initialised';

export const FLOATING_CARD_MAXIMISED_CLASS = FLOATING_CARD_PANEL_CLASS + '--maximised';

export const DEFAULT_FLOATING_CARD_OVERLAY_CONFIG: any = {
  hasBackdrop: false,
  backdropClass: 'floatingCard-backdrop', // NB. we don't have a backdrop by default, though
  disposeOnNavigation: true, 
  maxWidth: FLOATING_CARD_MAX_WIDTH_PORTRAIT,
  width: '100%',
  panelClass: FLOATING_CARD_PANEL_CLASS, 
}

export const DEFAULT_FLOATING_CARD_OPTIONS: FloatingCardOptions = {
  minimisedHeight: 6 * 16,
  landscapeBreakpoint: 900,
  // This should match the top bar margin
  landscapeMarginLeft: 16,
  // This should match the top bar height plus margins
  landscapeMarginTop: 16
}

export const DEFAULT_FLOATING_CARD_PEEK_ELEMENT_OPTIONS: FloatingCardPeekElementOptions = {
  offset: 0,
  dontPeek: false,
  persistentHeight: false,
}