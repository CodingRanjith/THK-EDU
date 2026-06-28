import puppeteer from 'puppeteer'

export async function htmlToPdfBuffer(html) {
  const browser = await puppeteer.launch({
    headless: true,
    channel: process.env.PUPPETEER_CHANNEL || 'chrome',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const isFullPageLetterhead = html.includes('width:210mm')
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: isFullPageLetterhead,
      pageRanges: isFullPageLetterhead ? '1' : undefined,
      margin: isFullPageLetterhead
        ? { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
        : { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    })
  } finally {
    await browser.close()
  }
}
