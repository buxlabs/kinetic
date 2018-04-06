import test from 'ava'
import puppeteer from 'puppeteer'
import express from 'express'
import path from 'path'

test('it is defined', async assert => {
  const app = express()
  app.use(express.static(path.join(__dirname, '../build')))
  app.use(express.static(path.join(__dirname, './fixture')))
  const server = await new Promise(resolve => {
    const server = app.listen(0, () => {
      resolve(server)
    })
  })
  const { port } = server.address()
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto(`http://localhost:${port}`)
  await page.waitFor(1000)
  await page.waitFor('#kinetic')
  await page.waitFor('#right')
  await page.click('#right')
  await page.waitFor(1000)
  await page.waitForSelector('.kinetic-decelerating-right')
  await page.waitFor('#down')
  await page.click('#down')
  await page.waitFor(1000)
  await page.waitForSelector('.kinetic-decelerating-down')
  await page.waitFor('#left')
  await page.click('#left')
  await page.waitFor(1000)
  await page.waitForSelector('.kinetic-decelerating-left')
  await page.waitFor('#up')
  await page.click('#up')
  await page.waitFor(1000)
  await page.waitForSelector('.kinetic-decelerating-up')
  const content = await page.content()
  assert.truthy(content.includes('index.js'))
})

