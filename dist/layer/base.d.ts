import VidarObject from '../object';
import Movie from '../movie';
interface BaseOptions {
    startTime: number;
    duration: number;
}
/**
 * A layer outputs content for the movie
 */
declare class Base implements VidarObject {
    type: string;
    publicExcludes: string[];
    propertyFilters: Record<string, <T>(value: T) => T>;
    enabled: boolean;
    /**
     * If the attached movie's playback position is in this layer
     */
    active: boolean;
    private _startTime;
    private _duration;
    private _movie;
    /**
     * Creates a new empty layer
     *
     * @param options
     * @param options.startTime - when to start the layer on the movie's
     * timeline
     * @param options.duration - how long the layer should last on the
     * movie's timeline
     */
    constructor(options: BaseOptions);
    attach(movie: Movie): void;
    detach(): void;
    /**
     * Called when the layer is activated
     */
    start(): void;
    /**
     * Called when the movie renders and the layer is active
     */
    render(): void;
    /**
    * Called when the layer is deactivated
     */
    stop(): void;
    get parent(): Movie;
    /**
     */
    get startTime(): number;
    set startTime(val: number);
    /**
     * The current time of the movie relative to this layer
     */
    get currentTime(): number;
    /**
     */
    get duration(): number;
    set duration(val: number);
    get movie(): Movie;
    getDefaultOptions(): BaseOptions;
}
export { Base, BaseOptions };
