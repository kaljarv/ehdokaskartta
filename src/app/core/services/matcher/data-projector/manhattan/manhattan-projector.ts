import {
  Coordinates,
  DataProjector,
  ProjectorData,
  ProjectorDatum,
  ProjectedMapping
} from '../data-projector';

export class ManhattanProjector extends DataProjector {

  readonly implementsPredict = true;
  readonly reportsProgess = false;

  private _origo: ProjectorDatum;

  constructor() {
    super();
  }

  /*
   * Overrides
   */

  public get progress(): number {
    return 0;
  }

  /*
   * If voter is not supplied the average of the data is used
   * NB. 
   * - If voter has any nullish values, those data do not
   *   add to the distance.
   * - Progress is not reported
   */
  protected _project(data: ProjectorData, voter: ProjectorDatum = undefined, onUpdate?: (number) => void): Promise<ProjectedMapping> {

    return new Promise((resolve, reject) => {

      // Send one progress message
      if (onUpdate) onUpdate(null);

      this._origo = voter;

      // If voter is not supplied the average of the data is used
      if (!this._origo) {
        this._origo = [];
        for (let i = 0; i < data[0].length; i++) {
          const sum = data.reduce((p, c) => p + c[i], 0);
          this._origo.push(sum / data.length);
        }
      }

      const result = data.map(d => {
        const dist = this._getDistance(d);
        // We need two dimensions, so add zero for the other
        return [dist, 0] as Coordinates;
      });

      // Add a datum for the voter, ie. zeros
      if (voter)
        result.push([0, 0]);
    
      resolve(result);
    });
  }

  protected _getDistance(datum: ProjectorDatum): number {
    if (!this._origo)
      throw new Error("Call project before _getDistance!");
    return datum.reduce((p, c, i) => {
      if (this._origo[i] == null)
        return p;
      return p + Math.abs(c - this._origo[i]);
    }, 0);
  }

  protected _predict(datum: ProjectorDatum): Coordinates {
    const dist = this._getDistance(datum);

    // We need two dimensions, so add zero for the other
    return [dist, 0];
  }

}