const request = require('request')
const Promise = require('bluebird')
const { Transform } = require('stream')
const requestPromise = require('request-promise')
// const lruCache = require('lru-cache')

let pageFloClient = function (config) {
  // let cache = lruCache({
  //   max: 500
  // })

  let defaults = {
    headers: {
      'Authorization': `Bearer ${config.apiKey}`
    }
  }

  let req = request.defaults(defaults)
  let rp = requestPromise.defaults(defaults)

  let getBlock = async function (blockId) {
    let res = await rp.get({
      url: `http://localhost:8008/client/block/${blockId}`
    })

    return res.body
  }

  let getPage = async function (pageId) {
    let res = await rp.get({
      url: `http://localhost:8008/client/page/${pageId}`
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
