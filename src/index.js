import jquery from 'jquery'
import Velocity from 'velocity-animate'
import {viewBox} from './viewbox'

/* global window */

const $ = jquery

const fullscreen = () => {
  const doc = window.document
  const docEl = doc.documentElement

  const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen
  const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen

  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl)
  } else {
    cancelFullScreen.call(doc)
  }
}

class PictureFrame {
  constructor ($, container, photos) {
    this.$ = $
    this.container = container
    this.photos = photos
    this.secondsPerPicture = 30
    this.init()
  }

  init () {
    this.elements = []
    this.current = -1
    this.photos.map((photo, key) => {
      this.photos[key].portrait = photo.width < photo.height
      const type = this.photos[key].portrait ? 'portrait' : 'landscape'
      this.elements.push(this.$(`<img src="${photo.url}" alt="${photo.title}" width="${photo.width}" height="${photo.height}" class="photo ${type}">`).appendTo(this.container))
    })
    this.start()
  }

  stop () {
    this.running = false
  }

  resize () {
    this.width = this.container.width()
    this.height = this.container.height()
    this.portrait = this.width < this.height
  }

  start () {
    this.running = true
    this.next()
  }

  next () {
    if (!this.running) return
    this.current++
    let prev = this.elements[this.current - 1]
    if (prev) {
      prev.removeClass('active')
    }
    if (this.current >= this.photos.length) {
      this.current = 0
    }
    const p = this.photos[this.current]
    const e = this.elements[this.current]
    e.addClass('active')
    this.resize()
    const vb = viewBox(p.width, p.height, this.width, this.height)
    e.css({
      top: 0,
      left: 0,
      width: vb.width,
      height: vb.height
    })
    Velocity(
      e,
      {
        top: vb.top,
        left: vb.left
      },
      {
        duration: Math.max(this.secondsPerPicture * 1000, Math.max(Math.abs(vb.left), Math.abs(vb.top)) / 100 * 1000),
        easing: 'easeinout',
        complete: () => {
          this.next()
        }
      }
    )
  }
}

$(() => {
  const container = $('body > main')
  let pf
  $.ajax({
    url: `./pictures.json?${Date.now()}`,
    success: pictures => {
      pf = new PictureFrame($, container, pictures)
      container.on('click', () => {
        fullscreen()
        pf.stop()
        container.empty()
        window.setTimeout(() => {
          pf = new PictureFrame($, container, pictures)
        }, 250)
      })
    }
  })
})
