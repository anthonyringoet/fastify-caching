'use strict'

const http = require('http')
const test = require('tap').test
const plugin = require('../plugin')
const fastify = require('fastify')

test('decorators get added', (t) => {
  t.plan(1)
  const instance = fastify()
  instance.register(plugin)
  instance.get('/', (req, reply) => {
    t.ok(reply.etag)
    reply.send()
  })
  instance.listen(0, (err) => {
    if (err) t.threw(err)
    instance.server.unref()
    const portNum = instance.server.address().port
    const address = `http://127.0.0.1:${portNum}`
    http.get(address, (res) => {}).on('error', (err) => t.threw(err))
  })
})

test('decorators add headers', (t) => {
  t.plan(2)
  const tag = '123456'
  const instance = fastify()
  instance.register(plugin)
  instance.get('/', (req, reply) => {
    reply
      .etag(tag)
      .send()
  })
  instance.listen(0, (err) => {
    if (err) t.threw(err)
    instance.server.unref()
    const portNum = instance.server.address().port
    const address = `http://127.0.0.1:${portNum}`
    http.get(address, (res) => {
      t.ok(res.headers.etag)
      t.equal(res.headers.etag, tag)
    }).on('error', (err) => t.threw(err))
  })
})

test('sets no-cache header', (t) => {
  t.plan(2)
  const instance = fastify()
  instance.register(plugin, { privacy: plugin.privacy.NOCACHE })
  instance.get('/', (req, reply) => {
    reply.send({ hello: 'world' })
  })
  instance.listen(0, (err) => {
    if (err) t.threw(err)
    instance.server.unref()
    const portNum = instance.server.address().port
    const address = `http://127.0.0.1:${portNum}`

    http.get(address, (res) => {
      t.ok(res.headers['cache-control'])
      t.equal(res.headers['cache-control'], 'no-cache')
    }).on('error', (err) => t.threw(err))
  })
})

test('sets private with max-age header', (t) => {
  t.plan(2)
  const instance = fastify()
  const opts = {
    privacy: plugin.privacy.PRIVATE,
    expiresIn: 300
  }
  instance.register(plugin, opts)
  instance.get('/', (req, reply) => {
    reply.send({ hello: 'world' })
  })
  instance.listen(0, (err) => {
    if (err) t.threw(err)
    instance.server.unref()
    const portNum = instance.server.address().port
    const address = `http://127.0.0.1:${portNum}`

    http.get(address, (res) => {
      t.ok(res.headers['cache-control'])
      t.equal(res.headers['cache-control'], 'private, max-age=300')
    }).on('error', (err) => t.threw(err))
  })
})

test('sets no-store with max-age header', (t) => {
  t.plan(2)
  const instance = fastify()
  instance.register(plugin, { privacy: 'no-store', expiresIn: 300 })
  instance.get('/', (req, reply) => {
    reply.send({ hello: 'world' })
  })
  instance.listen(0, (err) => {
    if (err) t.threw(err)
    instance.server.unref()
    const portNum = instance.server.address().port
    const address = `http://127.0.0.1:${portNum}`

    http.get(address, (res) => {
      t.ok(res.headers['cache-control'])
      t.equal(res.headers['cache-control'], 'no-store, max-age=300')
    }).on('error', (err) => t.threw(err))
  })
})

test('sets the expires header', (t) => {
  t.plan(2)
  const now = new Date()
  const instance = fastify()
  instance.register(plugin, { privacy: plugin.privacy.NOCACHE })
  instance.get('/', (req, reply) => {
    reply
      .expires(now)
      .send({ hello: 'world' })
  })
  instance.listen(0, (err) => {
    if (err) t.threw(err)
    instance.server.unref()
    const portNum = instance.server.address().port
    const address = `http://127.0.0.1:${portNum}`

    http.get(address, (res) => {
      t.ok(res.headers.expires)
      t.equal(res.headers.expires, now.toUTCString())
    }).on('error', (err) => t.threw(err))
  })
})
