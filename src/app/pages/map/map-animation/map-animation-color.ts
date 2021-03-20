/*
 * A very simple color object for use with animations.
 */

const COLOR_REGEX = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([01](?:\.\d*)?))?\s*?\)/i;

export class MapAnimationColor {
  constructor(
    public r: number = 0,
    public g: number = 0,
    public b: number = 0,
    public a: number = null,
  ) {
  }

  public static fromString(str: string): MapAnimationColor {
    const m = str.match(COLOR_REGEX);
    if (m) {
      const v = m.slice(1, m[4] == null ? 4 : 5).map(v => Number(v));
      return new MapAnimationColor(...v);
    } else {
      throw new Error(`Couldn't parse color string '${str}'!`);
    }
  }

  public get isRgba(): boolean {
    return this.a != null;
  }

  public toString(): string {
    return this.isRgba ? `rgba(${this.r},${this.g},${this.b},${this.a})` : `rgb(${this.r},${this.g},${this.b})`;
  }

  /*
   * Return a mix of the color with another, where weight is the fractional amount of this color
   */
  public mix(color: MapAnimationColor, weight: number): MapAnimationColor {
    if (weight < 0 || weight > 1) throw new Error("Weight for mix must be between 0 and 1!");
    const keys = ["r", "g", "b"];
    if (this.isRgba) keys.push("a");
    return new MapAnimationColor(...keys.map(k => weight * this[k] + (1 - weight) * color[k]));
  }

  /*
   * Check if the color is valid
   */
  // Not implemented, as we would need to define setters for the props too for consistency
  // protected _checkValidity(): void {
  //   ["r", "g", "b"].forEach(k => {
  //     if (this[k] < 0 || this[k] > 255) 
  //       throw new Error(`MapAnimationColor value '${k}' has to be between 0 and 255!`);
  //   });
  //   if (this.a != null && (this.a < 0 || this.a > 1))
  //     throw new Error(`MapAnimationColor value 'a' has to be between 0 and 1!`);
  // }
}