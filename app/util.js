import url from 'url'
import _ from 'lodash'
import base64 from 'base64-js'
import pako from 'pako'

export const compress = (obj) => base64.fromByteArray(pako.deflate(JSON.stringify({
  ...obj,
  _v: 2,
}), {
  level: 9,
  memLevel: 9,
}))

export const decompress = (s) => {
  try {
    return JSON.parse(pako.inflate(base64.toByteArray(s), { to: 'string' }))
  } catch (err) {
    console.error(err)
    return null
  }
}

export const buildUrl = (query) => {
  const urlObj = url.parse(window.location.href)
  delete urlObj.search
  urlObj.hash = ''
  urlObj.query = query
  return url.format(urlObj)
}

export const buildShareUrl = (obj) => {
  return buildUrl({
    s: compress(obj),
  })
}

export const convertMotionIdsToVoted = (motionIds) => _.reduce(motionIds, (r, motionId) => {
  r[motionId] = null
  return r
}, {})

export const getCurrentNav = () => {
  const hash = _.trimStart(window.location.hash, '#')
  switch (hash) {
    case 'about':
    case 'limitation':
      return hash
    default:
      return 'vote'
  }
}
