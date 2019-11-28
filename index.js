const hasTouch = 'ontouchend' in document

const DEFAULTS = {
  cursor: 'move',
  decelerate: true,
  triggerHardware: false,
  threshold: 0,
  y: true,
  x: true,
  slowdown: 0.9,
  maxvelocity: 40,
  throttleFPS: 60,
  invert: false,
  movingClass: {
    up: 'kinetic-moving-up',
    down: 'kinetic-moving-down',
    left: 'kinetic-moving-left',
    right: 'kinetic-moving-right'
  },
  deceleratingClass: {
    up: 'kinetic-decelerating-up',
    down: 'kinetic-decelerating-down',
    left: 'kinetic-decelerating-left',
    right: 'kinetic-decelerating-right'
  }
}

class Kinetic {
  constructor(element, settings) {
    this.settings = Object.assign({}, DEFAULTS, settings)
    this.el = element
    this.ACTIVE_CLASS = 'kinetic-active'
    this._initElements()
    this.el._Kinetic = this
  }
  start(options) {
    this.settings = Object.assign(this.settings, options)
    this.velocity = options.velocity || this.velocity
    this.velocityY = options.velocityY || this.velocityY
    this.settings.decelerate = false
    this._move()
  }
  end () {
    this.settings.decelerate = true
  }
  stop () {
    this.velocity = 0
    this.velocityY = 0
    this.settings.decelerate = true
    if (typeof this.settings.stopped === 'function') {
      this.settings.stopped.call(this)
    }
  }
  detach () {
    this._detachListeners()
    if (this.document) {
      this.document.removeEventListener('mouseup', this.documentResetHandler, false)
      this.document.removeEventListener('click', this.documentResetHandler, false)
    }
    this.el.classList.remove(this.ACTIVE_CLASS)
    this.el.style.cursor = ''
  }
  destroy () {
    this.detach()
  }
  attach () {
    if (this.el.classList.contains(this.ACTIVE_CLASS)) {
      return
    }
    this._attachListeners()
    this.el.classList.add(this.ACTIVE_CLASS)
    this.el.style.cursor = this.settings.cursor
  }
  _initElements () {
    this.el.classList.add(this.ACTIVE_CLASS)

    Object.assign(this, {
      xpos: null,
      prevXPos: false,
      ypos: null,
      prevYPos: false,
      mouseDown: false,
      throttleTimeout: 1000 / this.settings.throttleFPS,
      lastMove: null,
      elementFocused: null
    })

    this.velocity = 0
    this.velocityY = 0

    var that = this
    this.documentResetHandler = function () {
      that._resetMouse.apply(that)
    }

    this.document = document.documentElement
    this.document.addEventListener('mouseup', this.documentResetHandler, false)
    this.document.addEventListener('click', this.documentResetHandler, false)

    this._initEvents()

    this.el.style.cursor = this.settings.cursor

    if (this.settings.triggerHardware) {
      var prefixes = ['', '-ms-', '-webkit-', '-moz-']
      var styles = {
        'transform': 'translate3d(0,0,0)',
        'perspective': '1000',
        'backface-visibility': 'hidden'
      }
      for (var i = 0; i < prefixes.length; i++) {
        var prefix = prefixes[i]
        for (var key in styles) {
          if (styles.hasOwnProperty(key)) {
            this.el.style[prefix + key] = styles[key]
          }
        }
      }
    }
  }

  _getTouches (e) {
    return (e.originalEvent && (e.originalEvent.touches || e.originalEvent.changedTouches)) || e.changedTouches
  }

  _initEvents () {
    var self = this
    this.settings.events = {
      touchStart: function (e) {
        var touch
        if (self._useTarget(e.target, e)) {
          touch = self._getTouches(e)[0]
          self.threshold = self._threshold(e.target, e)
          self._start(touch.clientX, touch.clientY)
          e.stopPropagation()
        }
      },
      touchMove: function (e) {
        var touch
        if (self.mouseDown) {
          touch = self._getTouches(e)[0]
          self._inputmove(touch.clientX, touch.clientY)
          if (e.preventDefault) {
            e.preventDefault()
          }
        }
      },
      inputDown: function (e) {
        if (self._useTarget(e.target, e)) {
          self.threshold = self._threshold(e.target, e)
          self._start(e.clientX, e.clientY)
          self.elementFocused = e.target
          if (e.target.nodeName === 'IMG') {
            e.preventDefault()
          }
          e.stopPropagation()
        }
      },
      inputEnd: function (e) {
        if (self._useTarget(e.target, e)) {
          self._end()
          self.elementFocused = null
          if (e.preventDefault) {
            e.preventDefault()
          }
        }
      },
      inputMove: function (e) {
        if (self.mouseDown) {
          self._inputmove(e.clientX, e.clientY)
          if (e.preventDefault) {
            e.preventDefault()
          }
        }
      },
      scroll: function (e) {
        if (typeof self.settings.moved === 'function') {
          self.settings.moved.call(self, self.settings)
        }
        if (e.preventDefault) {
          e.preventDefault()
        }
      },
      inputClick: function (e) {
        if (Math.abs(self.velocity) > 0 || Math.abs(self.velocityY) > 0) {
          e.preventDefault()
          if (e.stopPropagation) {
            e.stopPropagation()
          }
          return false
        }
      },
      dragStart: function (e) {
        if (self._useTarget(e.target, e) && self.elementFocused) {
          if (e.preventDefault) {
            e.preventDefault()
          }
          if (e.stopPropagation) {
            e.stopPropagation()
          }
          return false
        }
      },
      selectStart: function (e) {
        if (typeof self.settings.selectStart === 'function') {
          return self.settings.selectStart.apply(self, arguments)
        } else if (self._useTarget(e.target, e)) {
          if (e.preventDefault) {
            e.preventDefault()
          }
          if (e.stopPropagation) {
            e.stopPropagation()
          }
          return false
        }
      }
    }

    this._attachListeners()
  }

  _inputmove (clientX, clientY) {
    if (!this.lastMove || new Date() > new Date(this.lastMove.getTime() + this.throttleTimeout)) {
      this.lastMove = new Date()

      if (this.mouseDown && (this.xpos || this.ypos)) {
        var movedX = (clientX - this.xpos)
        var movedY = (clientY - this.ypos)
        if (this.settings.invert) {
          movedX *= -1
          movedY *= -1
        }
        if (this.threshold > 0) {
          var moved = Math.sqrt(movedX * movedX + movedY * movedY)
          if (this.threshold > moved) {
            return
          } else {
            this.threshold = 0
          }
        }
        if (this.elementFocused) {
          this.elementFocused.blur()
          this.elementFocused = null
          this.el.focus()
        }

        this.settings.decelerate = false
        this.velocity = this.velocityY = 0

        var scrollLeft = this.scrollLeft()
        var scrollTop = this.scrollTop()

        this.scrollLeft(this.settings.x ? scrollLeft - movedX : scrollLeft)
        this.scrollTop(this.settings.y ? scrollTop - movedY : scrollTop)

        this.prevXPos = this.xpos
        this.prevYPos = this.ypos
        this.xpos = clientX
        this.ypos = clientY

        this._calculateVelocities()
        this._setMoveClasses(this.settings.movingClass)

        if (typeof this.settings.moved === 'function') {
          this.settings.moved.call(this, this.settings)
        }
      }
    }
  }

  _calculateVelocities () {
    this.velocity = this._capVelocity(this.prevXPos - this.xpos, this.settings.maxvelocity)
    this.velocityY = this._capVelocity(this.prevYPos - this.ypos, this.settings.maxvelocity)
    if (this.settings.invert) {
      this.velocity *= -1
      this.velocityY *= -1
    }
  }

  _end () {
    if (this.xpos && this.prevXPos && this.settings.decelerate === false) {
      this.settings.decelerate = true
      this._calculateVelocities()
      this.xpos = this.prevXPos = this.mouseDown = false
      this._move()
    }
  }

  _useTarget (target, event) {
    if (typeof this.settings.filterTarget === 'function') {
      return this.settings.filterTarget.call(this, target, event) !== false
    }
    return true
  }

  _threshold (target, event) {
    if (typeof this.settings.threshold === 'function') {
      return this.settings.threshold.call(this, target, event)
    }
    return this.settings.threshold
  }

  _start (clientX, clientY) {
    this.mouseDown = true
    this.velocity = this.prevXPos = 0
    this.velocityY = this.prevYPos = 0
    this.xpos = clientX
    this.ypos = clientY
  }

  _resetMouse () {
    this.xpos = false
    this.ypos = false
    this.mouseDown = false
  }

  _decelerateVelocity (velocity, slowdown) {
    return Math.floor(Math.abs(velocity)) === 0 ? 0 // is velocity less than 1?
      : velocity * slowdown // reduce slowdown
  }

  _capVelocity (velocity, max) {
    var newVelocity = velocity
    if (velocity > 0) {
      if (velocity > max) {
        newVelocity = max
      }
    } else {
      if (velocity < (0 - max)) {
        newVelocity = (0 - max)
      }
    }
    return newVelocity
  }

  _setMoveClasses (classes) {
    // The fix-me comment below is from original jQuery.kinetic project
    // FIXME: consider if we want to apply PL #44, this should not remove
    // classes we have not defined on the element!
    var settings = this.settings
    var el = this.el

    el.classList.remove(settings.movingClass.up)
    el.classList.remove(settings.movingClass.down)
    el.classList.remove(settings.movingClass.left)
    el.classList.remove(settings.movingClass.right)
    el.classList.remove(settings.deceleratingClass.up)
    el.classList.remove(settings.deceleratingClass.down)
    el.classList.remove(settings.deceleratingClass.left)
    el.classList.remove(settings.deceleratingClass.right)

    if (this.velocity > 0) {
      el.classList.add(classes.right)
    }
    if (this.velocity < 0) {
      el.classList.add(classes.left)
    }
    if (this.velocityY > 0) {
      el.classList.add(classes.down)
    }
    if (this.velocityY < 0) {
      el.classList.add(classes.up)
    }
  }

  _move () {
    var scroller = this._getScroller()
    var self = this
    var settings = this.settings

    if (settings.x && scroller.scrollWidth > 0) {
      this.scrollLeft(this.scrollLeft() + this.velocity)
      if (Math.abs(this.velocity) > 0) {
        this.velocity = settings.decelerate
          ? self._decelerateVelocity(this.velocity, settings.slowdown) : this.velocity
      }
    } else {
      this.velocity = 0
    }

    if (settings.y && scroller.scrollHeight > 0) {
      this.scrollTop(this.scrollTop() + this.velocityY)
      if (Math.abs(this.velocityY) > 0) {
        this.velocityY = settings.decelerate
          ? self._decelerateVelocity(this.velocityY, settings.slowdown) : this.velocityY
      }
    } else {
      this.velocityY = 0
    }

    self._setMoveClasses(settings.deceleratingClass)

    if (typeof settings.moved === 'function') {
      settings.moved.call(this, settings)
    }

    if (Math.abs(this.velocity) > 0 || Math.abs(this.velocityY) > 0) {
      if (!this.moving) {
        this.moving = true
        // tick for next movement
        window.requestAnimationFrame(function () {
          self.moving = false
          self._move()
        })
      }
    } else {
      self.stop()
    }
  }

  _getScroller () {
    // FIXME we may want to normalize behaviour across browsers as in original jQuery.kinetic
    // currently this won't work correctly on all browsers when attached to html or body element
    return this.el
  }

  scrollLeft (left) {
    var scroller = this._getScroller()
    if (typeof left === 'number') {
      scroller.scrollLeft = left
      this.settings.scrollLeft = left
    } else {
      return scroller.scrollLeft
    }
  }

  scrollTop (top) {
    var scroller = this._getScroller()
    if (typeof top === 'number') {
      scroller.scrollTop = top
      this.settings.scrollTop = top
    } else {
      return scroller.scrollTop
    }
  }

  _attachListeners () {
    const node = this.el
    const settings = this.settings

    if (hasTouch) {
      node.addEventListener('touchstart', settings.events.touchStart, false)
      node.addEventListener('touchend', settings.events.inputEnd, false)
      node.addEventListener('touchmove', settings.events.touchMove, false)
    }

    node.addEventListener('mousedown', settings.events.inputDown, false)
    node.addEventListener('mouseup', settings.events.inputEnd, false)
    node.addEventListener('mousemove', settings.events.inputMove, false)

    node.addEventListener('click', settings.events.inputClick, false)
    node.addEventListener('scroll', settings.events.scroll, false)
    node.addEventListener('selectstart', settings.events.selectStart, false)
    node.addEventListener('dragstart', settings.events.dragStart, false)
  }

  _detachListeners () {
    const node = this.el
    const settings = this.settings

    if (hasTouch) {
      node.removeEventListener('touchstart', settings.events.touchStart, false)
      node.removeEventListener('touchend', settings.events.inputEnd, false)
      node.removeEventListener('touchmove', settings.events.touchMove, false)
    }

    node.removeEventListener('mousedown', settings.events.inputDown, false)
    node.removeEventListener('mouseup', settings.events.inputEnd, false)
    node.removeEventListener('mousemove', settings.events.inputMove, false)

    node.removeEventListener('click', settings.events.inputClick, false)
    node.removeEventListener('scroll', settings.events.scroll, false)
    node.removeEventListener('selectstart', settings.events.selectStart, false)
    node.removeEventListener('dragstart', settings.events.dragStart, false)
  }
}

export default Kinetic
