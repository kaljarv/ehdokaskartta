/*
 * Base class for utilities to project multidimensional data into 2D.
 */

export type ProjectorDatum = number[];
export type ProjectorData = ProjectorDatum[];
export type Coordinates = [number, number]
export type ProjectedMapping = Coordinates[];

export abstract class DataProjector {

  readonly implementsPredict: boolean;
  readonly reportsProgess: boolean;

  /*
   * We need to save these for later calls to finalize
   */
  private _scalingParams: {
    bounds: [[number, number], [number, number]],
    max: number,
    scale: number,
    voter?: Coordinates
  } = {
    bounds: [[undefined, undefined], [undefined, undefined]],
    max: undefined,
    scale: undefined,
    voter: undefined,
  };

  constructor() {}

  /*
   * Call to start the mapping process.
   */
  public project(data: ProjectorData, disableVoter: boolean = false, onUpdate: (number) => void = null, finalize: boolean = true): Promise<ProjectedMapping> {
    return new Promise(async (resolve, reject) => {

      const result = await this._project(data, disableVoter, onUpdate) as ProjectedMapping;

      resolve(finalize ? this.finalize(result , disableVoter) : result);
    });
  }

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
   * Do the projection
   */
  protected _project(data: ProjectorData, disableVoter: boolean = false, onUpdate: (number) => void = null): Promise<ProjectedMapping> {
    throw new Error("Not implemented!");
  }

  /*
   * Get the projected coordinates for one datum
   */
  public predict(datum: ProjectorDatum, dontScale: boolean = false): Coordinates {
    const coords = this._predict(datum);
    if (dontScale)
      return coords;
    return this.scaleSolution([coords])[0];
  }

  /*
   * Calculate the projected coordinates for one datum
   * Not all projectors implement this, but if they do, also set
   * implementsPredict to true.
   */
  protected _predict(datum: ProjectorDatum): Coordinates {
    throw new Error("Not implemented!");
  }

  /*
   * Other methods
   */

  /*
   * Scale values into 0–1 centered on the voter unless disabled
   */
  public finalize(solution: ProjectedMapping, disableVoter: boolean = false): ProjectedMapping {
    this._calcScalingParams(solution, disableVoter);
    return this.scaleSolution(solution);
  }

  /*
   * Calculate the scaling parameters and save them so we can use them later
   */
  private _calcScalingParams(solution: ProjectedMapping, disableVoter: boolean = false): void {

    // Shorthand
    const params = this._scalingParams;

    // Find out min and max dimensions to normalize projected coordinates 
    params.bounds = [this._getBounds(solution, 0), this._getBounds(solution, 1)];

    // Set normalization scale based on the maximum dimension
    params.max = 0;

    if (disableVoter) {

      // Check both dims (i) to find the one with the maximum spread
      for (let i = 0; i < 2; i++) {
        const dist = params.bounds[i][1] - params.bounds[i][0];
        if (dist > params.max)
          params.max = dist;
      }
      params.scale = 1 / params.max;

    } else {

      // Set scale based on the greatest absolute distance from the voter in either direction
      // The last item in the solution is the voter, which we pop
      // TODO: This is a bit dangerous!
      params.voter = solution.pop();

      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const dist = Math.abs(params.voter[i] - params.bounds[i][j]);
          if (dist > params.max)
            params.max = dist;
        }
      }
      // We need to multiply max by two as it's the max distance from the voter in either direction on either axis
      params.scale = 1 / (2 * params.max);

    }
  }

  /*
   * Perform solution scaling
   */
  public scaleSolution(solution: ProjectedMapping): ProjectedMapping {
    
    // Scaled solution
    const scaled: ProjectedMapping = [];

    // Shorthand
    const params = this._scalingParams;

    // Set scaled coordinates
    if (!params.voter) {

      for (let i = 0; i < solution.length; i++) {
        // Scale and normalise by subtracting the dimension's lower bound
        // and center the smaller dimension: 
        // max - (bounds[0/1][1] - bounds[0/1][0]) goes to zero for the bigger dim
        // and represents the difference for the smaller, of which we add half
        const x = (solution[i][0] - params.bounds[0][0] + (params.max - (params.bounds[0][1] - params.bounds[0][0])) / 2) * params.scale;
        const y = (solution[i][1] - params.bounds[1][0] + (params.max - (params.bounds[1][1] - params.bounds[1][0])) / 2) * params.scale;
        scaled.push([x, y]);
      }

    } else {

      for (let i = 0; i < solution.length; i++) {
        // Scale and center on voter
        const x = (solution[i][0] - params.voter[0]) * params.scale + 0.5;
        const y = (solution[i][1] - params.voter[1]) * params.scale + 0.5;
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