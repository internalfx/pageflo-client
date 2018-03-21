const got = require('got')
const request = require('request')
const { Transform } = require('stream')
// const lruCache = require('lru-cache')

let pageFloClient = function (config) {
  // let cache = lruCache({
  //   max: 500
  // })

  let req = request.defaults({
    auth: {
      user: config.username,
      pass: config.password
    }
  })

  let getBlock = async function (blockId) {
    let res = await got(`http://localhost:8008/client/block/${blockId}`, {
      auth: `${config.username}:${config.password}`
    })

    return res.body
  }

  let getPage = async function (pageId) {
    let res = await got(`http://localhost:8008/client/page/${pageId}`, {
      auth: `${config.username}:${config.password}`
    })

    return res.body
  }

  let getFile = async function (spec) {
    let passthru = new Transform()

    let headers = {
      range: spec.headers.range
    }

    let fileReq = await req.get({
      url: `http://localhost:8008/client/file/${spec.filename}`,
      qs: {
        w: spec.width,
        h: spec.height
      },
      headers: headers
    })

    passthru._transform = function (chunk, encoding, callback) {
      callback(null, chunk)
    }

    fileReq.pipe(passthru)

    let res = await new Promise(function (resolve) {
      fileReq.on('response', function (response) {
        resolve(response)
      })
    })

    delete res.headers['set-cookie']

    return {
      headers: res.headers,
      status: res.statusCode,
      stream: passthru
    }
  }

  return Object.freeze({
    getBlock,
    getPage,
    getFile
  })
}

module.exports = pageFloClient
