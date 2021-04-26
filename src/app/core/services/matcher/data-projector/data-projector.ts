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
  protected _scalingParams: {
    bounds: [[number, number], [number, number]],
    max: number,
    scale: number,
    voter?: Coordinates,
    centreOn: Coordinates,
  } = {
    bounds: [[undefined, undefined], [undefined, undefined]],
    max: undefined,
    scale: undefined,
    voter: undefined,
    centreOn: [0.5, 0.5]
  };

  constructor() {}

  /*
   * Call to start the mapping process.
   */
  public project(data: ProjectorData, voter: ProjectorDatum = undefined, onUpdate: (number) => void = undefined, finalize: boolean = true): Promise<ProjectedMapping> {
    return new Promise(async (resolve, reject) => {

      const result = await this._project(data, voter, onUpdate) as ProjectedMapping;
      const voterResult = voter ? result.pop() : undefined;
        
      resolve(finalize ? this.finalize(result, voterResult) : result);
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
   * If voter is supplied, their coordinates should be the last item in the solution
   */
  protected _project(data: ProjectorData, voter: ProjectorDatum = undefined, onUpdate: (number) => void = undefined): Promise<ProjectedMapping> {
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
  public finalize(solution: ProjectedMapping, voter: Coordinates = undefined): ProjectedMapping {
    this._calcScalingParams(solution, voter);
    return this.scaleSolution(solution);
  }

  /*
   * Calculate the scaling parameters and save them so we can use them later
   */
  private _calcScalingParams(solution: ProjectedMapping, voter: Coordinates = undefined): void {

    // Shorthand
    const params = this._scalingParams;

    // Find out min and max dimensions to normalize projected coordinates 
    params.bounds = [this._getBounds(solution, 0), this._getBounds(solution, 1)];

    // Set normalization scale based on the maximum dimension
    params.max = 0;

    if (!voter) {

      params.voter = undefined;

      // Check both dims (i) to find the one with the maximum spread
      for (let i = 0; i < 2; i++) {
        const dist = params.bounds[i][1] - params.bounds[i][0];
        if (dist > params.max)
          params.max = dist;
      }
      params.scale = 1 / params.max;

    } else {

      // Set scale based on the greatest absolute distance from the voter in either direction
      params.voter = voter;

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

    // Calc offsets
    let offsetX: number, 
        offsetY: number,
        centreX = params.centreOn[0],
        centreY = params.centreOn[1];

    if (!params.voter) {
      // Center on the smaller dimension: 
      // max - (bounds[0/1][1] - bounds[0/1][0]) goes to zero for the bigger dim
      // and represents the difference for the smaller
      const rangeX = params.bounds[0][1] - params.bounds[0][0],
            rangeY = params.bounds[1][1] - params.bounds[1][0];
      offsetX = 0.5 * (params.max - 2 * rangeX) - params.bounds[0][0];
      offsetY = 0.5 * (params.max - 2 * rangeY) - params.bounds[1][0];
      centreY -= 0.5;
    } else {
      // Center on voter
      offsetX = -1 * params.voter[0];
      offsetY = -1 * params.voter[1];
    }

    // Normalize and apply offsets
    for (let i = 0; i < solution.length; i++) {
      const x = (solution[i][0] + offsetX) * params.scale + centreX,
            y = (solution[i][1] + offsetY) * params.scale + centreY;
      scaled.push([x, y]);
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
      if (vals[j][index] < min)
        min = vals[j][index];
      else if (vals[j][index] > max)
        max = vals[j][index];
    }
    return [min, max];
  }
}