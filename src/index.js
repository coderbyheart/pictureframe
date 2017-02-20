import jquery from 'jquery'

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
    this.secondsPerPicture = 10
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
    this.container.bind('touchstart', ev => {
      const xpos = ev.originalEvent.touches[0].pageX
      if (xpos < this.width / 4) {
        this.gotoPrev()
        ev.preventDefault()
      }
      if (xpos > this.width * 0.75) {
        this.gotoNext()
        ev.preventDefault()
      }
    })
    this.start()
  }

  stop () {
    window.clearInterval(this.running)
    this.running = undefined
  }

  resize () {
    this.width = this.container.width()
    this.height = this.container.height()
    this.portrait = this.width < this.height
  }

  start () {
    this.running = window.setInterval(this.next.bind(this), this.secondsPerPicture * 1000)
    this.next()
  }

  gotoPrev() {
    this.stop()
    this.elements[this.current].removeClass('active')
    this.current -= 2
    if (this.current < 0) this.current = this.elements.length - 2
    this.start()
  }

  gotoNext() {
    this.stop()
    this.start()
  }

  next () {
    if (!this.running) return
    this.resize()
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
    if (p.width > p.height) {
      e.css({width: this.width, height: this.width / p.width * p.height, top: Math.round((this.height - (this.width / p.width * p.height)) / 2)})
    } else {
      e.css({height: this.height, width: this.height / p.height * p.width, left: Math.round((this.width - (this.height / p.height * p.width)) / 2)})
    }
  }
}

$(() => {
  const container = $('body > main')
  let pf
  $.ajax({
    url: `./pictures.json?${Date.now()}`,
    dataType: 'json',
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
