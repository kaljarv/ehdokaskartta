/*
 * Base class for utilities to project multidimensional data into 2D.
 */

export type ProjectorData = number[][];
export type ProjectedMapping = [number, number][];

export abstract class DataProjector {

  readonly reportsProgess: boolean;

  constructor() { }

  /*
   * Overrideable methods
   */

  /*
   * Return progress on a scale of 0-100
   */
  public get progress(): number {
    throw new Error("Not implemented!");
  }

  /*
   * Call to start the mapping process. In the end, this should call finalize and return the results.
   */
  public project(data: ProjectorData, disableVoter: boolean = false, onUpdate?: (number) => void ): Promise<ProjectedMapping> {
    throw new Error("Not implemented!");
  }

  /*
   * Other methods
   */

  /*
   * Scale values into 0–1 centered on the voter unless disabled
   */
  public finalize(solution: ProjectedMapping, disableVoter: boolean = false): ProjectedMapping {

    // Scaled solution
    const scaled: ProjectedMapping = new Array<[number, number]>();

    // Find out min and max dimensions to normalize tSNE coordinates 
    const bounds: [number[], number[]] = [this._getBounds(solution, 0),
                                          this._getBounds(solution, 1)];
    // Set normalization scale based on the maximum dimension
    let max: number = 0;
    let scale: number;
    let voter: [number, number]; // This will only be used if not voterDisabled

    if (disableVoter) {

      // Check both dims (i) to find the one with the maximum spread
      for (let i = 0; i < 2; i++) {
        let dist = bounds[i][1] - bounds[i][0];
        if (dist > max)
          max = dist;
      }
      scale = 1 / max;

    } else {

      // Set scale based on the greatest absolute distance from the voter in either direction
      // The last item in the solution is the voter (can't use pop as the solver needs the solution)
      voter = solution[solution.length - 1];
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          let dist = Math.abs(voter[i] - bounds[i][j]);
          if (dist > max)
            max = dist;
        }
      }
      // We need to multiply max by two as it's the max distance from the voter in either direction on either axis
      scale = 1 / (2 * max);

    }
    
    // Set scaled coordinates
    if (disableVoter) {

      for (let i = 0; i < solution.length; i++) {
        // Scale and normalise by subtracting the dimension's lower bound
        // and center the smaller dimension: 
        // max - (bounds[0/1][1] - bounds[0/1][0]) goes to zero for the bigger dim
        // and represents the difference for the smaller, of which we add half
        const x = (solution[i][0] - bounds[0][0] + (max - (bounds[0][1] - bounds[0][0])) / 2) * scale;
        const y = (solution[i][1] - bounds[1][0] + (max - (bounds[1][1] - bounds[1][0])) / 2) * scale;
        scaled.push([x, y]);
      }

    } else {

      for (let i = 0; i < solution.length; i++) {
        // Skip the last one as that's the voter
        if (i === solution.length - 1)
          break;
        // Scale and center on voter
        const x = (solution[i][0] - voter[0]) * scale + 0.5;
        const y = (solution[i][1] - voter[1]) * scale + 0.5;
        scaled.push([x, y]);
      }

    }
    return scaled;
  }

  // Get minimum and maximum values from the arrays
  private _getBounds(vals: ProjectedMapping, index: number = 0): [min: number, max: number] {
    if (!vals.length) {
      throw new Error("Argument vals cannot be empty");
    }
    let min: number = vals[0][index];
    let max: number = min;
    // Start from one as we already assigned [0]
    for (let j = 1; j < vals.length; j++) {
      if (vals[j][index] < min) {
        min = vals[j][index];
      } else if (vals[j][index] > max) {
        max = vals[j][index];
      }
    }
    return [min, max];
  }
}