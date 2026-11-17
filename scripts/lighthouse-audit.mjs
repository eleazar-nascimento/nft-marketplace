import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'

const rootDir = process.cwd()
const configPath = path.join(rootDir, 'lighthouse', 'config.json')
const reportsDir = path.join(rootDir, 'lighthouse', 'reports')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  throw new Error(`Preview server did not start at ${url}`)
}

function resolveChromePath() {
  const cachedArm = path.join(
    os.homedir(),
    'Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  )
  if (fs.existsSync(cachedArm)) return cachedArm
  const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (fs.existsSync(systemChrome)) return systemChrome
  return undefined
}

async function main() {
  fs.mkdirSync(reportsDir, { recursive: true })

  let previewProcess = null
  let serverAlreadyRunning = false
  try {
    const check = await fetch(config.baseUrl)
    serverAlreadyRunning = check.ok
  } catch {
    serverAlreadyRunning = false
  }

  if (!serverAlreadyRunning) {
    previewProcess = spawn('pnpm', ['preview', '--port', '4173'], {
      cwd: rootDir,
      stdio: 'ignore',
    })
    await waitForServer(config.baseUrl)
  }

  const chromePath = resolveChromePath()
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  })

  const summary = {
    generatedAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: `${os.platform()} ${os.release()} (${os.arch()})`,
      cpu: os.cpus()[0]?.model ?? 'unknown',
      lighthouseVersion: lighthouse.default?.version ?? '13.x',
    },
    thresholds: config.thresholds,
    results: [],
  }

  try {
    for (const target of config.targets) {
      for (const profile of config.profiles) {
        const url = `${config.baseUrl}${target.path}`
        const runs = []

        for (let runIndex = 1; runIndex <= config.runsPerTarget; runIndex += 1) {
          const isDesktop = profile === 'desktop'
          const runnerResult = await lighthouse(
            url,
            {
              port: chrome.port,
              logLevel: 'error',
              output: ['json', 'html'],
              onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
              formFactor: isDesktop ? 'desktop' : 'mobile',
              screenEmulation: isDesktop
                ? {
                    mobile: false,
                    width: 1440,
                    height: 900,
                    deviceScaleFactor: 1,
                    disabled: false,
                  }
                : {
                    mobile: true,
                    width: 390,
                    height: 844,
                    deviceScaleFactor: 2,
                    disabled: false,
                  },
              throttlingMethod: 'simulate',
              throttling: isDesktop
                ? {
                    rttMs: 40,
                    throughputKbps: 10240,
                    cpuSlowdownMultiplier: 1,
                  }
                : {
                    rttMs: 150,
                    throughputKbps: 1638.4,
                    cpuSlowdownMultiplier: 4,
                  },
            },
          )

          const lhr = runnerResult.lhr
          const [jsonReport, htmlReport] = runnerResult.report
          const baseName = `${target.slug}-${profile}-run${runIndex}`
          fs.writeFileSync(path.join(reportsDir, `${baseName}.json`), jsonReport)
          fs.writeFileSync(path.join(reportsDir, `${baseName}.html`), htmlReport)

          runs.push({
            run: runIndex,
            scores: {
              performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
              accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
              'best-practices': Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
              seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
            },
            metrics: {
              lcpMs: Math.round(lhr.audits['largest-contentful-paint']?.numericValue ?? 0),
              cls: Number((lhr.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(4)),
              tbtMs: Math.round(lhr.audits['total-blocking-time']?.numericValue ?? 0),
            },
          })
        }

        const medians = {
          scores: {
            performance: median(runs.map((r) => r.scores.performance)),
            accessibility: median(runs.map((r) => r.scores.accessibility)),
            'best-practices': median(runs.map((r) => r.scores['best-practices'])),
            seo: median(runs.map((r) => r.scores.seo)),
          },
          metrics: {
            lcpMs: median(runs.map((r) => r.metrics.lcpMs)),
            cls: median(runs.map((r) => r.metrics.cls)),
            tbtMs: median(runs.map((r) => r.metrics.tbtMs)),
          },
        }

        summary.results.push({
          slug: target.slug,
          name: target.name,
          path: target.path,
          profile,
          runs,
          median: medians,
        })

        console.log(
          `[Lighthouse] ${target.slug} (${profile}) median -> Perf: ${medians.scores.performance}, A11y: ${medians.scores.accessibility}, BP: ${medians.scores['best-practices']}, SEO: ${medians.scores.seo} | LCP: ${medians.metrics.lcpMs}ms, CLS: ${medians.metrics.cls}, TBT: ${medians.metrics.tbtMs}ms`,
        )
      }
    }

    fs.writeFileSync(path.join(reportsDir, 'summary.json'), JSON.stringify(summary, null, 2))
  } finally {
    await chrome.kill()
    if (previewProcess) {
      previewProcess.kill('SIGTERM')
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
