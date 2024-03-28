const env = require("browser-env")
env()

const test = require("node:test")
const assert = require("node:assert")
const sinon = require("sinon")
const Kinetic = require("../build")

test("it has a lifecycle", () => {
  const node = document.createElement("div")
  const kinetic = new Kinetic(node)
  assert(kinetic)
  kinetic.destroy()
})

test("it unbinds all document listeners", () => {
  const node = document.createElement("div")
  sinon.spy(document.documentElement, "addEventListener")
  sinon.spy(document.documentElement, "removeEventListener")
  const kinetic = new Kinetic(node)
  kinetic.destroy()
  const actual = document.documentElement.addEventListener.callCount
  const expected = document.documentElement.removeEventListener.callCount
  assert(actual > 0)
  assert.deepEqual(actual, expected)
})

test("it unbinds all node listeners", () => {
  const node = document.createElement("div")
  sinon.spy(node, "addEventListener")
  sinon.spy(node, "removeEventListener")
  const kinetic = new Kinetic(node)
  kinetic.destroy()
  const actual = node.addEventListener.callCount
  const expected = node.removeEventListener.callCount
  assert(actual > 0)
  assert.deepEqual(actual, expected)
  node.addEventListener.restore()
  node.removeEventListener.restore()
})
