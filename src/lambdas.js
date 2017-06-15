import rp from 'request-promise'
import AWS from 'aws-sdk'
import Promise from 'bluebird'

const s3 = new AWS.S3({region: 'eu-central-1'})

const rx = /\["(https:\/\/[^.]+.googleusercontent\.com\/[^"]+)",([0-9]+),([0-9]+),/
const extractPhotos = data => data.match(new RegExp(rx, 'g'))
  .map(m => m.match(rx))
  .map(p => {
    const width = +p[2]
    const height = +p[3]
    const url = `${p[1]}=w${width}-h${height}-no`
    return {url, width, height}
  })

export const pictureframe = (event, context, callback) => {
  rp({
    method: 'GET',
    headers: {
      'dnt': '1',
      'accept-language': 'en-US,en;q=0.8,de;q=0.6',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'authority': 'photos.google.com'

    },
    uri: event.album
  })
    .then(data => extractPhotos(data))
    .then(photos => Promise
      .promisify(s3.putObject, {context: s3})({
        Bucket: event.bucket,
        Key: 'pictures.json',
        Body: JSON.stringify(photos),
        ContentType: 'applicaton/json'
      })
    )
    .then(() => callback(null, 'OK'))
}
