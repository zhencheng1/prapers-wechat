import fs from 'node:fs'

const BASE = 'http://127.0.0.1:5188'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json()
  const target = targets.find((item) => item.type === 'page')
  if (!target) throw new Error('no page target')

  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })

  let sequence = 0
  const pending = new Map()
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
  }

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = ++sequence
      pending.set(id, resolve)
      socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async function evaluate(expression) {
    const response = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (response.result?.exceptionDetails) {
      throw new Error(response.result.exceptionDetails.text)
    }
    return response.result?.result?.value
  }

  async function waitFor(expression, timeout = 8000) {
    const started = Date.now()
    while (Date.now() - started < timeout) {
      const value = await evaluate(expression)
      if (value) return value
      await sleep(250)
    }
    throw new Error(`timeout waiting for: ${expression}`)
  }

  async function navigate(path) {
    await send('Page.navigate', { url: `${BASE}/#${path}` })
    await sleep(1800)
    await waitFor("document.body && document.body.innerText.length > 30")
    await sleep(600)
  }

  async function screenshot(name) {
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    })
    fs.writeFileSync(`tmp-${name}.png`, Buffer.from(result.result.data, 'base64'))
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  })

  await navigate('/pages/index/index')
  await evaluate('localStorage.clear()')
  await evaluate('location.reload()')
  await sleep(2500)
  await waitFor("document.body.innerText.includes('示例题库')")
  await sleep(600)

  const homeText = await evaluate('document.body.innerText')
  console.log('HOME_OK', homeText.includes('今天也要刷题'))
  await screenshot('home')

  const keys = await evaluate('Object.keys(localStorage)')
  console.log('STORAGE_KEYS', keys)
  const bankKey = keys.find((key) => key.includes('qb:v1:banks'))
  if (!bankKey) throw new Error('banks key not found')
  const bankRaw = await evaluate(`localStorage.getItem(${JSON.stringify(bankKey)})`)
  const parsedBanks = JSON.parse(bankRaw)
  const banks = Array.isArray(parsedBanks) ? parsedBanks : parsedBanks.data
  console.log('BANK', banks[0]?.id, banks[0]?.name, banks[0]?.questionCount)
  const bankId = banks[0].id

  await navigate(`/pages/bank/detail?id=${bankId}`)
  const detailText = await evaluate('document.body.innerText')
  console.log('DETAIL_OK', detailText.includes('开始练习'), detailText.includes('顺序练习'))
  await screenshot('detail')

  const started = await evaluate(`(() => {
    const card = [...document.querySelectorAll('.mode-card')].find((el) => el.innerText.includes('顺序练习'))
    if (!card) return false
    card.click()
    return true
  })()`)
  console.log('SEQUENCE_CLICK', started)
  await sleep(1500)
  await waitFor("document.querySelectorAll('.option-row').length > 0")
  const quizText = await evaluate('document.body.innerText')
  console.log('QUIZ_OK', quizText.includes('第 1 题'), quizText.includes('单选题'))
  await screenshot('quiz')

  const picked = await evaluate(`(() => {
    const option = document.querySelector('.option-row')
    if (!option) return false
    option.click()
    return true
  })()`)
  console.log('OPTION_CLICK', picked)
  await sleep(1200)
  const answeredText = await evaluate('document.body.innerText')
  console.log(
    'ANSWER_FEEDBACK',
    answeredText.includes('回答正确') || answeredText.includes('回答错误'),
    answeredText.includes('正确答案'),
  )
  await screenshot('answered')

  const nextClicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('.btn')].find((el) => el.innerText.includes('下一题'))
    if (!button) return false
    button.click()
    return true
  })()`)
  console.log('NEXT_CLICK', nextClicked)
  await sleep(1000)
  await screenshot('quiz-next')

  const sheetClicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('.btn')].find((el) => el.innerText.trim() === '答题卡')
    if (!button) return false
    button.click()
    return true
  })()`)
  console.log('SHEET_CLICK', sheetClicked)
  await sleep(500)
  const sheetText = await evaluate('document.body.innerText')
  console.log('SHEET_OK', sheetText.includes('答题卡'), Boolean(await evaluate("document.querySelector('.sheet')")))
  await screenshot('sheet')
  await evaluate(`(() => {
    const close = [...document.querySelectorAll('*')].find((el) => el.innerText?.trim() === '关闭')
    close?.click()
    return Boolean(close)
  })()`)
  await sleep(300)

  const favoriteClicked = await evaluate(`(() => {
    const star = document.querySelector('.favorite')
    if (!star) return false
    star.click()
    return true
  })()`)
  console.log('FAVORITE_CLICK', favoriteClicked)
  await sleep(400)
  await navigate('/pages/favorite/index')
  const favoriteText = await evaluate('document.body.innerText')
  console.log('FAVORITE_OK', favoriteText.includes('示例题库'), favoriteText.includes('收藏 1 题'))

  await navigate('/pages/wrong/index')
  const wrongText = await evaluate('document.body.innerText')
  console.log('WRONG_OK', wrongText.includes('示例题库'), wrongText.includes('1 题待复习'))

  const progress = await evaluate(
    `localStorage.getItem(Object.keys(localStorage).find((key) => key.includes('progress')))`,
  )
  console.log('PROGRESS_SAVED', progress)

  await navigate(`/pages/quiz/index?bankId=${bankId}&mode=exam`)
  await sleep(1500)
  await waitFor("document.querySelectorAll('.option-row').length > 0")
  console.log('EXAM_OK', (await evaluate('document.body.innerText')).includes('模拟考试'))
  await screenshot('exam')

  await evaluate(`document.querySelector('.option-row')?.click()`)
  await sleep(300)
  const submitClicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('.btn')].find((el) => el.innerText.trim() === '交卷')
    if (!button) return false
    button.click()
    return true
  })()`)
  console.log('EXAM_SUBMIT_CLICK', submitClicked)
  await sleep(600)
  const modalText = await evaluate('document.body.innerText')
  console.log('MODAL_VISIBLE', modalText.includes('交卷后不能再修改答案'))
  const confirmClicked = await evaluate(`(() => {
    const button = document.querySelector('.uni-modal__btn_primary')
    if (!button) return false
    button.click()
    return true
  })()`)
  console.log('MODAL_CONFIRM', confirmClicked)
  await sleep(1800)
  const resultText = await evaluate('document.body.innerText')
  console.log('RESULT_OK', resultText.includes('考试得分'), resultText.includes('需要复习的题目'))
  await screenshot('result')

  await send('Page.enable')
  await send('DOM.enable')
  await navigate('/pages/import/index')

  const importText = fs.readFileSync('tests/fixtures/import-bank.json', 'utf8')
  const installFilePicker = `(() => {
    const text = ${JSON.stringify(importText)}
    const original = HTMLInputElement.prototype.click
    HTMLInputElement.prototype.click = function () {
      const transfer = new DataTransfer()
      transfer.items.add(new File([text], 'tmp-import.json', { type: 'application/json' }))
      this.files = transfer.files
      this.dispatchEvent(new Event('change'))
      HTMLInputElement.prototype.click = original
    }
    return true
  })()`
  console.log('FILE_PICKER_PATCH', await evaluate(installFilePicker))

  const importClicked = await evaluate(`(() => {
    const el = [...document.querySelectorAll('.step-card')].find((node) => node.innerText?.includes('选择 JSON 文件'))
    if (!el) return false
    el.click()
    return true
  })()`)
  console.log('IMPORT_CLICK', importClicked)
  await sleep(1500)
  await waitFor("document.body.innerText.includes('导入预览')")
  const previewText = await evaluate('document.body.innerText')
  console.log('PREVIEW_OK', previewText.includes('E2E 导入题库'), previewText.includes('2 题可导入'))
  await screenshot('preview')

  const confirmImportClicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('.btn')].find((el) => el.innerText.trim().startsWith('导入 2 题'))
    if (!button) return false
    button.click()
    return true
  })()`)
  console.log('PREVIEW_IMPORT_CLICK', confirmImportClicked)
  await sleep(500)
  await evaluate(`document.querySelector('.uni-modal__btn_primary')?.click()`)
  await sleep(2200)
  const detailAfterImport = await evaluate('document.body.innerText')
  console.log(
    'IMPORT_DONE',
    detailAfterImport.includes('E2E 导入题库'),
    detailAfterImport.includes('2 题'),
  )
  await screenshot('imported-detail')

  console.log('E2E_DONE')
  socket.close()
  process.exit(0)
}

main().catch((error) => {
  console.error('E2E_FAIL', error)
  process.exit(1)
})
