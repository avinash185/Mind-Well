import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve('c:/Users/avina/AAI/Venky')
const CLIENT_DIR = path.join(ROOT, 'client')
const SERVER_DIR = path.join(ROOT, 'server')
const PY_DIR = path.join(ROOT, 'python_backend')

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch { return null }
}

function listDirTree(dir, maxDepth = 3, prefix = '') {
  const lines = []
  function walk(current, depth, basePrefix) {
    if (depth > maxDepth) return
    const entries = fs
      .readdirSync(current, { withFileTypes: true })
      .filter((e) => e.name.toLowerCase() !== 'node_modules')
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const e of entries) {
      const rel = path.relative(dir, path.join(current, e.name))
      const isDir = e.isDirectory()
      lines.push(`${basePrefix}${isDir ? '├── ' : '├── '}${rel}${isDir ? '/' : ''}`)
      if (isDir) {
        walk(path.join(current, e.name), depth + 1, basePrefix + '│   ')
      }
    }
  }
  walk(dir, 1, '')
  return lines
}

function readEnvExamples() {
  const examplePath = path.join(SERVER_DIR, '.env.example')
  let lines = []
  try {
    lines = fs.readFileSync(examplePath, 'utf-8').split('\n')
  } catch {}
  // Mask values
  return lines.map(l => {
    const m = l.match(/^(\s*[A-Z0-9_]+)=(.*)$/)
    if (!m) return l
    const k = m[1]
    return `${k}=<value>`
  })
}

function readCurrentEnv() {
  const envPath = path.join(SERVER_DIR, '.env')
  let lines = []
  try {
    lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  } catch {}
  return lines.map(l => {
    const m = l.match(/^(\s*[A-Z0-9_]+)=(.*)$/)
    if (!m) return l
    const key = m[1]
    const val = m[2]
    const masked = /(_KEY|SECRET|TOKEN|PASSWORD)/.test(key) ? '<redacted>' : val
    return `${key}=${masked}`
  })
}

function parseRoutes() {
  const routesDir = path.join(SERVER_DIR, 'routes')
  const mountMap = {
    'auth.js': '/api/auth',
    'user.js': '/api/user',
    'assessment.js': '/api/assessments',
    'chat.js': '/api/chat',
    'resource.js': '/api/resources',
    'session.js': '/api/sessions',
    'counselor.js': '/api/counselors',
    'booking.js': '/api/bookings',
  }
  const list = []
  for (const fname of fs.readdirSync(routesDir)) {
    const full = path.join(routesDir, fname)
    const src = fs.readFileSync(full, 'utf-8')
    const mount = mountMap[fname] || 'N/A'
    const regex = /router\.(get|post|put|delete)\(\s*['\"]([^'\"]+)['\"]\s*,/g
    let m
    while ((m = regex.exec(src)) !== null) {
      const method = m[1].toUpperCase()
      const route = m[2]
      list.push(`${method} ${mount}${route.startsWith('/') ? '' : '/'}${route}`)
    }
  }
  return list.sort()
}

function sectionHeading(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2 })
}

function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 } })
}

async function main() {
  const rootPkg = readJSON(path.join(ROOT, 'package.json')) || {}
  const clientPkg = readJSON(path.join(CLIENT_DIR, 'package.json')) || {}
  const serverPkg = readJSON(path.join(SERVER_DIR, 'package.json')) || {}

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: 'Mental Health Platform – Project Technical Overview', heading: HeadingLevel.TITLE }),
        new Paragraph({ text: 'Generated on ' + new Date().toLocaleString() }),

        sectionHeading('Overview'),
        bullet('Monorepo: client (React/Vite/Tailwind), server (Node/Express/MongoDB), python_backend (Flask + Gemini).'),
        bullet(`Root scripts: ${Object.keys(rootPkg.scripts || {}).join(', ')}`),

        sectionHeading('Repository Structure'),
        ...listDirTree(ROOT, 3).map(line => new Paragraph({ text: line })),

        sectionHeading('Frontend (client)'),
        bullet(`Dev: ${clientPkg.scripts?.dev || 'vite'}`),
        bullet(`Build: ${clientPkg.scripts?.build || 'vite build'}`),
        bullet('Proxy: Vite dev server proxies /api to backend.'),
        bullet('Styling: Tailwind (darkMode: class); ThemeContext for Light/Dark/System toggling.'),
        bullet('Auth: AuthContext handles JWT tokens, refresh token, and redirects.'),

        sectionHeading('Backend (server)'),
        bullet('Express app with security middleware: helmet, rate limiting, CORS.'),
        bullet('JWT auth middleware, refresh token handling, optionalAuth, requireAdmin.'),
        bullet('MongoDB via Mongoose; models: User, Assessment, Session, Resource, Counselor, Booking.'),
        bullet('Routes mounted under /api/*: auth, user, assessments, chat, resources, sessions, counselors, bookings.'),

        sectionHeading('Python Agent (python_backend)'),
        bullet('Flask app exposing /health and /chat using Google Generative AI.'),
        bullet('Optional ngrok tunnel support controlled by ENABLE_NGROK.'),

        sectionHeading('Environment Variables (example)'),
        ...readEnvExamples().map(line => new Paragraph({ text: line })),

        sectionHeading('Environment Variables (current, masked)'),
        ...readCurrentEnv().map(line => new Paragraph({ text: line })),

        sectionHeading('API Endpoints (Node server)'),
        ...parseRoutes().map(r => new Paragraph({ text: r })),

        sectionHeading('Dependencies'),
        bullet('Root devDependencies: ' + Object.entries(rootPkg.devDependencies || {}).map(([k,v])=>`${k}@${v}`).join(', ')),
        bullet('Client dependencies: ' + Object.entries(clientPkg.dependencies || {}).map(([k,v])=>`${k}@${v}`).join(', ')),
        bullet('Client devDependencies: ' + Object.entries(clientPkg.devDependencies || {}).map(([k,v])=>`${k}@${v}`).join(', ')),
        bullet('Server dependencies: ' + Object.entries(serverPkg.dependencies || {}).map(([k,v])=>`${k}@${v}`).join(', ')),
        bullet('Server devDependencies: ' + Object.entries(serverPkg.devDependencies || {}).map(([k,v])=>`${k}@${v}`).join(', ')),

        sectionHeading('Run & Build'),
        bullet('Start both: npm run dev (root).'),
        bullet('Start backend only: cd server && npm run dev.'),
        bullet('Start frontend only: cd client && npm run dev.'),
        bullet('Build frontend: cd client && npm run build.'),

        sectionHeading('Notes'),
        bullet('Password change: backend route re-fetches user to access passwordHash; refresh tokens invalidated.'),
        bullet('Theme: ThemeProvider applies html.dark and persists preference; server stores effective light/dark.'),
      ]
    }]
  })

  const buffer = await Packer.toBuffer(doc)
  const outPath = path.join(ROOT, 'Project_Details.docx')
  try {
    fs.writeFileSync(outPath, buffer)
    console.log('Generated:', outPath)
  } catch (err) {
    const altPath = path.join(ROOT, 'Project_Details_updated.docx')
    fs.writeFileSync(altPath, buffer)
    console.log('Generated (alternate):', altPath)
  }
}

main().catch(err => {
  console.error('Failed to generate document:', err)
  process.exit(1)
})