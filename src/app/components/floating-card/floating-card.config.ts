import { InjectionToken,
         Type } from '@angular/core';

export const FLOATING_CARD_DATA = new InjectionToken<any>('FLOATING_CARD_DATA');

export interface FloatingCardConfigOptions {
  panelClass?: string;
  hiddenWhenOpened?: boolean;
  minimizedHeight?: string;
}

export const DEFAULT_FLOATING_CARD_CONFIG_OPTIONS: FloatingCardConfigOptions = {
  hiddenWhenOpened: false,
  minimizedHeight: '6rem',
}

export class FloatingCardConfig {
  public options: FloatingCardConfigOptions;

  constructor(
    public component: Type<any>, 
    public data: any = {},
    options?: FloatingCardConfigOptions,
  ) {
    this.options = {...DEFAULT_FLOATING_CARD_CONFIG_OPTIONS, ...options};
  }
}

export interface FloatingCardPeekElementOptions {
  offset?: string;
  dontPeek?: boolean;
  persistentHeight?: boolean;
}

export const DEFAULT_FLOATING_CARD_PEEK_ELEMENT_OPTIONS: FloatingCardPeekElementOptions = {
  offset: null,
  dontPeek: false,
  persistentHeight: false,
}