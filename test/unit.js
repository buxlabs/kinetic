let counts = {
  document: {
    add: 0,
    remove: 0,
  },
  node: {
    add: 0,
    remove: 0,
  },
}

Object.defineProperty(global, "document", {
  configurable: true,
  get() {
    return {
      createElement() {
        return {
          callCount: 0,
          addEventListener() {
            counts.node.add++
          },
          removeEventListener() {
            counts.node.remove++
          },
          classList: {
            add() {},
            remove() {},
          },
          style: {},
        }
      },
      addEventListener() {},
      removeEventListener() {},
      documentElement: {
        addEventListener() {
          counts.document.add++
        },
        removeEventListener() {
          counts.document.remove++
        },
      },
    }
  },
})

const test = require("node:test")
const assert = require("node:assert")
const Kinetic = require("../build")

test("it has a lifecycle", () => {
  const node = document.createElement("div")
  const kinetic = new Kinetic(node)
  assert(kinetic)
  kinetic.destroy()
})

test("it unbinds all document listeners", () => {
  const node = document.createElement("div")
  const kinetic = new Kinetic(node)
  kinetic.destroy()
  assert(counts.document.add > 0)
  assert.deepEqual(counts.document.add, counts.document.remove)
  counts.document.add = 0
  counts.document.remove = 0
  counts.node.add = 0
  counts.node.remove = 0
})

test("it unbinds all node listeners", () => {
  const node = document.createElement("div")
  const kinetic = new Kinetic(node)
  kinetic.destroy()
  assert(counts.node.add > 0)
  assert.deepEqual(counts.node.add, counts.node.remove)
  counts.document.add = 0
  counts.document.remove = 0
  counts.node.add = 0
  counts.node.remove = 0
})
