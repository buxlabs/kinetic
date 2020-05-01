const test = require('ava')
const sinon = require('sinon')
const Kinetic = require('../build')

test('it has a lifecycle', assert => {
  const node = document.createElement('div')
  const kinetic = new Kinetic(node)
  assert.truthy(kinetic)
  kinetic.destroy()
})

test('it unbinds all document listeners', assert => {
  const node = document.createElement('div')
  sinon.spy(document.documentElement, 'addEventListener')
  sinon.spy(document.documentElement, 'removeEventListener')
  const kinetic = new Kinetic(node)
  kinetic.destroy()
  const actual = document.documentElement.addEventListener.callCount
  const expected = document.documentElement.removeEventListener.callCount
  assert.truthy(actual > 0)
  assert.deepEqual(actual, expected)
})

test('it unbinds all node listeners', assert => {
  const node = document.createElement('div')
  sinon.spy(node, 'addEventListener')
  sinon.spy(node, 'removeEventListener')
  const kinetic = new Kinetic(node)
  kinetic.destroy()
  const actual = node.addEventListener.callCount
  const expected = node.removeEventListener.callCount
  assert.truthy(actual > 0)
  assert.deepEqual(actual, expected)
  node.addEventListener.restore()
  node.removeEventListener.restore()
})
