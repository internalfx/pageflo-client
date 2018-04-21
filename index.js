const request = require('request')
const Promise = require('bluebird')
const { Transform } = require('stream')
const requestPromise = require('request-promise')
// const lruCache = require('lru-cache')

const defaultConfig = {
  server: {
    apiKey: null,
    host: null,
    protocol: 'https'
  },
  client: {
    filesPath: '/files'
  }
}

let pageFloClient = function (config) {
  // let cache = lruCache({
  //   max: 500
  // })
  let server = {...defaultConfig.server, ...config.server}
  let client = {...defaultConfig.client, ...config.client}

  let cleanHeaders = function (headers) {
    headers = {...headers}
    delete headers.cookie
    return headers
  }

  let buildPayload = function (params) {
    if (params.headers == null) {
      console.log('PAGEFLO: headers missing!')
    } else {
      params.headers = cleanHeaders(params.headers)
    }
    return {client, ...params}
  }

  let defaults = {
    headers: {
      'Authorization': `Bearer ${server.apiKey}`
    }
  }

  let req = request.defaults(defaults)
  let rp = requestPromise.defaults(defaults)

  let getFile = async function (params) {
    let passthru = new Transform()

    let fileReq = await req.post({
      url: `${server.protocol}://${server.host}/client/file`,
      body: buildPayload(params),
      json: true,
      headers: {range: params.headers.range}
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

  let getBlock = async function (params) {
    let res = await rp.post({
      url: `${server.protocol}://${server.host}/client/block`,
      body: buildPayload(params),
      json: true
    }).catch(function (err) {
      console.log(err)
      return ''
    })

    return res
  }

  let getPage = async function (params) {
    let res = await rp.post({
      url: `${server.protocol}://${server.host}/client/page`,
      body: buildPayload(params),
      json: true
    }).catch(function (err) {
      console.log(err)
      return null
    })

    // res = JSON.parse(res)

    return res
  }

  let getCollection = async function (params) {
    let res = await rp.post({
      url: `${server.protocol}://${server.host}/client/collection`,
      body: buildPayload(params),
      json: true
    }).catch(function (err) {
      console.log(err)
      return null
    })

    // res = JSON.parse(res)

    return res
  }

  return Object.freeze({
    getFile,
    getBlock,
    getPage,
    getCollection
  })
}

module.exports = pageFloClient
