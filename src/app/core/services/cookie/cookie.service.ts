import { Injectable } from '@angular/core';
import { CookieService as NgxCookieService } from 'ngx-cookie-service';


export const COOKIE_PREFIX = "CM-VoterAnswer-";
export const COOKIE_VALUE_SEPARATOR = ",";
export const COOKIE_PATH = "/";
export const COOKIE_DOMAIN = null;
export const COOKIE_LIFE = 1000 * 60 * 60 * 24 * 7; // Cookie lifetime in millisecs (the last number is day)


/*
 * A wrapper for ngx cookie service.
 */
@Injectable({
  providedIn: 'root'
})
export class CookieService {

  constructor(
    private cookie: NgxCookieService
  ) {}

  public write(name: string, value: string | number): void {
    // Save in cookie
    let expiry = new Date();
    expiry.setTime(expiry.getTime() + COOKIE_LIFE);
    // TODO Secure cookies don't currently work, maybe because of localhost?
    this.cookie.set(COOKIE_PREFIX + name, value.toString(), expiry, COOKIE_PATH, COOKIE_DOMAIN, false, 'Strict');
  }

  public writeList(name: string, values: string[] | number[], stripEmpty: boolean = false): void {
    this.write(name, (values as any[]).filter(v => !(stripEmpty && (v === '' || v == null))).map(v => v.toString()).join(COOKIE_VALUE_SEPARATOR));
  }

  public read(name: string): string | null {
    if (this.cookie.check(COOKIE_PREFIX + name))
      return this.cookie.get(COOKIE_PREFIX + name);
    return null;
  }

  public readList(name: string, stripEmpty: boolean = false): string[] | null {
    const value = this.read(name);
    if (value !== null)
      return value.split(COOKIE_VALUE_SEPARATOR).filter(v => !(stripEmpty && v === ''));
    return null;
  }

  public delete(name: string): void {
    this.cookie.delete(COOKIE_PREFIX + name, COOKIE_PATH, COOKIE_DOMAIN);
  }

  public deleteAll(): void {
    this.cookie.deleteAll(COOKIE_PATH, COOKIE_DOMAIN);
  }


}