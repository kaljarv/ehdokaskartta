import {
  Coordinates,
  DataProjector,
  ProjectorData,
  ProjectorDatum,
  ProjectedMapping
} from '../data-projector';
import {
  ManhattanProjector
} from '../manhattan';
import {
  PcaProjector
} from '../pca';


export type AngularMethod = 'PCA' | 'precalculated';

export interface RadarProjectorOptions {
  angularMethod?: AngularMethod;
  angularValues?: number[];
  centreOn?: Coordinates;
  minimumDistance?: number;
  minimumAngle?: number;
  maximumAngle?: number;
}

export class RadarProjector extends DataProjector {

  public angularMethod: AngularMethod;
  public minimumDistance: number;
  public minimumAngle: number;
  public maximumAngle: number;

  readonly implementsPredict = true;
  readonly reportsProgess = false;

  private _distanceBounds: {
    min: number,
    max: number
  } = {
    min: undefined,
    max: undefined
  };
  private _distanceValues: number[];
  private _distanceProjector: DataProjector;

  private _angularBounds: {
    min: number,
    max: number
  } = {
    min: undefined,
    max: undefined
  };
  private _angularValues: number[];
  private _angularProjector: DataProjector;

  constructor(options?: RadarProjectorOptions) {
    super();
    if (options?.angularMethod) {
      this.angularMethod = options.angularMethod;
      if (this.angularMethod === 'precalculated' && options.angularValues)
        this.setAngularValues(options.angularValues);
    }
    this.minimumDistance = options?.minimumDistance || 0;
    this.minimumAngle = options?.minimumAngle || 0;
    this.maximumAngle = options?.maximumAngle || Math.PI;
    // Set the scaling centre to the middle of the bottom edge
    this._scalingParams.centreOn = options?.centreOn || [0.5, 1.0];
  }

  /*
   * Overrides
   */

  public get progress(): number {
    // We don't unfortunately have access to the internal progress
    return 0;
  }

  /*
  * NB. Progress is not reported
  */
  protected _project(data: ProjectorData, voter: ProjectorDatum = undefined, onUpdate?: (number) => void): Promise<ProjectedMapping> {

    return new Promise(async (resolve, reject) => {

      // Send one progress message
      if (onUpdate) onUpdate(null);

      // Calc angular values
      if (this.angularMethod !== 'precalculated')
        await this._calcAngularValues(data, voter);
      else if (!this._angularValues)
        throw new Error("If method is precalculated, angularValues must be supplied!");

      // Calc distance values
      await this._calcDistanceValues(data, voter);

      // Calculate coordinates
      const result: ProjectedMapping = [];

      for (let i = 0; i < data.length; i++)
        result.push(this._calcCoordinates(this._distanceValues[i], this._angularValues[i]));

      if (voter)
        result.push(this._calcCoordinates(0, 0));

      resolve(result);
    });
  }

  /*
   * Calculate the coordinates (before scaling) for the given non-normalized
   * angular value and distance.
   * The width of the radar projection is 2 * (1 + this.minimumDistance) * max distance.
   * The vertical coordinate of the voter is 0.
   */
  protected _calcCoordinates(distanceValue: number, angularValue: number): Coordinates {
    const angle = this.minimumAngle + this._normalizeAngle(angularValue) * (this.maximumAngle - this.minimumAngle);
    const dist = distanceValue + this.minimumDistance * this._distanceBounds.max;
    const xCentre = (1 + this.minimumDistance) * this._distanceBounds.max;
    let x = dist * Math.cos(angle) + xCentre,
        y = dist * Math.sin(angle) * -1;
    return [x, y];
  }

  protected _predict(datum: ProjectorDatum): Coordinates {
    const dist = this._distanceProjector.predict(datum, true)[0],
          angle = this._angularProjector.predict(datum, true)[0];
    return this._calcCoordinates(dist, angle);
  }

  protected async _calcDistanceValues(data: ProjectorData, voter?: ProjectorDatum): Promise<void> {

    this._distanceProjector = new ManhattanProjector();

    return new Promise(async (resolve, reject) => {
      const result = await this._distanceProjector.project(data, voter, undefined, false);
      this._distanceValues = result.map(d => d[0]);
      this._calcDistanceBounds();
      resolve();
    });
  }

  protected _calcDistanceBounds(values: number[] = this._distanceValues): void {
    const minMax = this._getMinMax(values);
    this._distanceBounds.min = minMax[0];
    this._distanceBounds.max = minMax[1];
  }

  public setAngularValues(values: number[]): void {
    this._angularValues = values;
    this._calcAngularBounds();
  }

  protected async _calcAngularValues(data: ProjectorData, voter?: ProjectorDatum): Promise<void> {

    if (this.angularMethod === 'PCA')
      this._angularProjector = new PcaProjector();
    else 
      throw new Error(`CalcAngularValues not implemented for method '${this.angularMethod}'!`);

    return new Promise(async (resolve, reject) => {
      const result = await this._angularProjector.project(data, voter, undefined, false);
      this._angularValues = result.map(d => d[0]);
      this._calcAngularBounds();
      resolve();
    });
  }

  protected _calcAngularBounds(values: number[] = this._angularValues): void {
    const minMax = this._getMinMax(values);
    this._angularBounds.min = minMax[0];
    this._angularBounds.max = minMax[1];
  }

  protected _normalizeAngle(value: number): number {
    const range = this._angularBounds.max - this._angularBounds.min;
    if (range === 0)
      return 0.5;
    return (value - this._angularBounds.min) / range;
  }

  protected _getMinMax(values: number[]): [min: number, max: number] {
    let min = values[0];
    let max = min;
    // Start from one as we already assigned [0]
    for (let j = 1; j < values.length; j++) {
      if (values[j] < min)
        min = values[j];
      else if (values[j] > max)
        max = values[j];
    }
    return [min, max];
  }

}