import {
  DataProjector,
  ProjectorData,
  ProjectedMapping
} from '../data-projector';

import { PCA } from 'ml-pca';

export class PcaProjector extends DataProjector {

  constructor() {
    super();
  }

  public get progress(): number {
    // We don't unfortunately have access to the internal progress
    return 0;
  }

  /*
  * Call to start the mapping process. In the end, this will call finalize to calculate
  * the final positions. NB. We don't fire any onUpdate events.
  */
  public project(data: ProjectorData, disableVoter: boolean = false, onUpdate_notAvailable?: (number) => void): Promise<ProjectedMapping> {

    return new Promise((resolve, reject) => {
      // Calculate PCA
      const pca = new PCA(data);
      const result = pca.predict(data).to2DArray();

      if (result[0].length === 0)
        throw new Error("PCA did not produce results.");

      for (let i = 0; i < result.length; i++) {
        // Just in case we only have one column
        if (result[i].length < 2) {
          result[i].push(result[i][0]);
        // Otherwise trim to 2 columns
        } else {
          for (let j = 2; j < result[i].length; j++) {
            delete result[i][j];
          }
        }
      }

      const scaled = this.finalize(result as ProjectedMapping, disableVoter);
      resolve(scaled);
    });

  }

}