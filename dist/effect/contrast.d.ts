import { Shader } from './shader';
/**
 * Changes the contrast
 */
declare class Contrast extends Shader {
    contrast: number;
    /**
     * @param [contrast=1] - the contrast multiplier
     */
    constructor(contrast?: number);
}
export default Contrast;
