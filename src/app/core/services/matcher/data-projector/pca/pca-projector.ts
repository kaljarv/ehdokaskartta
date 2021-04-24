import {
  Coordinates,
  DataProjector,
  ProjectorData,
  ProjectorDatum,
  ProjectedMapping
} from '../data-projector';

import { PCA } from 'ml-pca';

export class PcaProjector extends DataProjector {

  readonly implementsPredict = true;
  readonly reportsProgess = false;

  private _pca: PCA;

  constructor() {
    super();
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
  protected _project(data: ProjectorData, voter: ProjectorDatum = null, onUpdate?: (number) => void): Promise<ProjectedMapping> {

    return new Promise((resolve, reject) => {

      // Send one progress message
      if (onUpdate) onUpdate(null);

      // Data
      const projData = voter ? data.concat([voter]) : data;

      // Calculate PCA
      this._pca = new PCA(projData);
      const result = this._pca.predict(projData).to2DArray();
      resolve(this._processPrediction(result));
    });
  }

  protected _processPrediction(prediction: number[][]): ProjectedMapping {
    
    const result: ProjectedMapping = [];

    if (prediction[0].length === 0)
      throw new Error("PCA did not produce results.");

    for (let i = 0; i < prediction.length; i++) {
      // Just in case we only have one column, add zeros for second column
      if (prediction[i].length < 2)
        result.push([prediction[i][0], 0.]);
      else
        result.push([prediction[i][0], prediction[i][1]]);
    }

    return result;
  }

  protected _predict(datum: ProjectorDatum): Coordinates {
    if (!this._pca)
      throw new Error("Call project before predict!");
    const result = this._pca.predict([datum]).to2DArray();
    return this._processPrediction(result)[0];
  }

}