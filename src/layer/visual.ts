import { Dynamic, val, applyOptions, Color } from '../util'
import { Base, BaseOptions } from './base'
import { Visual as VisualEffect } from '../effect/visual'
import { publish } from '../event'

interface VisualOptions extends BaseOptions {
  x?: Dynamic<number>
  y?: Dynamic<number>
  width?: Dynamic<number>
  height?: Dynamic<number>
  background?: Dynamic<Color>
  border?: Dynamic<{
    color: Color
    thickness?: number
  }>

  opacity?: Dynamic<number>
}

/** Any layer that renders to a canvas */
class Visual extends Base {
  x: Dynamic<number>
  y: Dynamic<number>
  width: Dynamic<number>
  height: Dynamic<number>
  background: Dynamic<Color>
  border: Dynamic<{
    color: Color
    thickness: number
  }>

  opacity: Dynamic<number>

  /**
   * The layer's rendering canvas
   */
  readonly canvas: HTMLCanvasElement

  /**
   * The context of {@link Visual#canvas}
   */
  readonly cctx: CanvasRenderingContext2D

  // readonly because it's a proxy
  readonly effects: VisualEffect[]

  private _effectsBack: VisualEffect[]

  /**
   * Creates a visual layer
   */
  constructor (options: VisualOptions) {
    super(options)
    // Only validate extra if not subclassed, because if subclcass, there will
    // be extraneous options.
    applyOptions(options, this)

    this.canvas = document.createElement('canvas')
    this.cctx = this.canvas.getContext('2d')

    this._effectsBack = []
    this.effects = new Proxy(this._effectsBack, {
      deleteProperty: (target, property) => {
        const value = target[property]
        value.detach()
        delete target[property]
        return true
      },
      set: (target, property, value) => {
        if (!isNaN(Number(property))) {
          // The property is a number (index)
          if (target[property])
            target[property].detach()

          value.attach(this)
        }
        target[property] = value
        return true
      }
    })
  }

  /**
   * Render visual output
   */
  render (): void {
    // Prevent empty canvas errors if the width or height is 0
    const width = val(this, 'width', this.currentTime)
    const height = val(this, 'height', this.currentTime)
    if (width === 0 || height === 0)
      return

    this.beginRender()
    this.doRender()
    this.endRender()
  }

  beginRender (): void {
    this.canvas.width = val(this, 'width', this.currentTime)
    this.canvas.height = val(this, 'height', this.currentTime)
    this.cctx.globalAlpha = val(this, 'opacity', this.currentTime)
  }

  doRender (): void {
    /*
     * If this.width or this.height is null, that means "take all available
     * screen space", so set it to this._move.width or this._movie.height,
     * respectively canvas.width & canvas.height are already interpolated
     */
    if (this.background) {
      this.cctx.fillStyle = val(this, 'background', this.currentTime)
      // (0, 0) relative to layer
      this.cctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    const border = val(this, 'border', this.currentTime)
    if (border && border.color) {
      this.cctx.strokeStyle = border.color
      // This is optional.. TODO: integrate this with defaultOptions
      this.cctx.lineWidth = border.thickness || 1
    }
  }

  endRender (): void {
    const w = val(this, 'width', this.currentTime) || val(this.movie, 'width', this.movie.currentTime)
    const h = val(this, 'height', this.currentTime) || val(this.movie, 'height', this.movie.currentTime)
    if (w * h > 0)
      this._applyEffects()

    // else InvalidStateError for drawing zero-area image in some effects, right?
  }

  _applyEffects (): void {
    for (let i = 0; i < this.effects.length; i++) {
      const effect = this.effects[i]
      if (effect && effect.enabled)
        // Pass relative time
        effect.apply(this, this.movie.currentTime - this.startTime)
    }
  }

  /**
   * Convienence method for <code>effects.push()</code>
   * @param effect
   * @return the layer (for chaining)
   */
  addEffect (effect: VisualEffect): Visual {
    this.effects.push(effect); return this
  }

  get ready (): boolean {
    // Typescript doesn't support `super.ready` when targetting es5
    const superReady = Object.getOwnPropertyDescriptor(Base.prototype, 'ready').get.call(this)
    const isReady = superReady && this.effects.every(effect => effect.ready)
    if (isReady) {
      const type = `${this.type}.ready`
      publish(this, type, { target: this, type })
    }
    return isReady
  }

  /**
   * @deprecated See {@link https://github.com/etro-js/etro/issues/131}
   */
  getDefaultOptions (): VisualOptions {
    return {
      ...Base.prototype.getDefaultOptions(),
      /**
       * @name module:layer.Visual#x
       * @desc The offset of the layer relative to the movie
       */
      x: 0,
      /**
       * @name module:layer.Visual#y
       * @desc The offset of the layer relative to the movie
       */
      y: 0,
      /**
       * @name module:layer.Visual#width
       */
      width: null,
      /**
       * @name module:layer.Visual#height
       */
      height: null,
      /**
       * @name module:layer.Visual#background
       * @desc The color code for the background, or <code>null</code> for
       * transparency
       */
      background: null,
      /**
       * @name module:layer.Visual#border
       * @desc The border style, or <code>null</code> for no border
       */
      border: null,
      /**
       * @name module:layer.Visual#opacity
       */
      opacity: 1
    }
  }
}
Visual.prototype.publicExcludes = Base.prototype.publicExcludes.concat(['canvas', 'cctx', 'effects'])
Visual.prototype.propertyFilters = {
  ...Base.prototype.propertyFilters,
  /*
   * If this.width or this.height is null, that means "take all available screen
   * space", so set it to this._move.width or this._movie.height, respectively
   */
  width: function (width) {
    return width != undefined ? width : this._movie.width // eslint-disable-line eqeqeq
  },
  height: function (height) {
    return height != undefined ? height : this._movie.height // eslint-disable-line eqeqeq
  }
}

export { Visual, VisualOptions }
