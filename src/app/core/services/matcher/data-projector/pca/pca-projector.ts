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
  protected _project(data: ProjectorData, disableVoter: boolean = false, onUpdate?: (number) => void): Promise<ProjectedMapping> {

    return new Promise((resolve, reject) => {

      // Send one progress message
      if (onUpdate) onUpdate(null);

      // Calculate PCA
      this._pca = new PCA(data);
      const result = this._pca.predict(data).to2DArray();

      if (result[0].length === 0)
        throw new Error("PCA did not produce results.");

      for (let i = 0; i < result.length; i++) {
        // Just in case we only have one column
        if (result[i].length < 2)
          result[i].push(result[i][0]);
        // Otherwise trim to 2 columns
        else
          for (let j = 2; j < result[i].length; j++)
            delete result[i][j];
      }
      
      resolve(result as ProjectedMapping);
    });
  }

  public predict(datum: ProjectorDatum): Coordinates {
    if (!this._pca)
      throw new Error("Call project before predict!");
    return this._pca.predict([datum]).to2DArray()[0] as Coordinates;
  }

}