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

function shouldListEntry(name) {
  return name.toLowerCase() !== 'node_modules'
}

function shouldTraverseEntry(name) {
  const lower = name.toLowerCase()
  // Only exclude deep traversal for extremely large dirs; keep them listed
  return !(lower === 'node_modules' || lower === 'venv' || lower === '__pycache__')
}

function listPaths(dir, baseDir = dir, depth = 0, maxDepth = 5) {
  const items = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  entries.sort((a,b)=>a.name.localeCompare(b.name))
  for (const e of entries) {
    if (!shouldListEntry(e.name)) continue
    const abs = path.join(dir, e.name)
    const rel = path.relative(baseDir, abs)
    items.push({ abs, rel, isDir: e.isDirectory() })
    if (e.isDirectory() && depth < maxDepth && shouldTraverseEntry(e.name)) {
      items.push(...listPaths(abs, baseDir, depth + 1, maxDepth))
    }
  }
  return items
}

function parseRoutesGrouped() {
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
  const grouped = {}
  if (!fs.existsSync(routesDir)) return grouped
  for (const fname of fs.readdirSync(routesDir)) {
    const full = path.join(routesDir, fname)
    if (!fs.statSync(full).isFile()) continue
    const src = fs.readFileSync(full, 'utf-8')
    const mount = mountMap[fname] || 'N/A'
    const regex = /router\.(get|post|put|delete)\(\s*['\"]([^'\"]+)['\"]\s*,/g
    let m
    const list = []
    while ((m = regex.exec(src)) !== null) {
      const method = m[1].toUpperCase()
      const route = m[2]
      list.push(`${method} ${mount}${route.startsWith('/') ? '' : '/'}${route}`)
    }
    grouped[path.join('server', 'routes', fname)] = list
  }
  return grouped
}

function describe(rel, isDir) {
  const p = rel.replace(/\\/g, '/').toLowerCase()
  if (isDir) {
    if (p === 'client') return 'React + Vite frontend project root.'
    if (p === 'client/src') return 'Frontend source code root.'
    if (p.startsWith('client/src/components')) return 'Reusable React UI components.'
    if (p.startsWith('client/src/pages')) return 'React route pages.'
    if (p.startsWith('client/src/contexts')) return 'React Context providers.'
    if (p.startsWith('client/public')) return 'Static assets served by Vite.'
    if (p === 'server') return 'Node/Express backend project root.'
    if (p.startsWith('server/routes')) return 'Express routers.'
    if (p.startsWith('server/models')) return 'Mongoose data models.'
    if (p.startsWith('server/middleware')) return 'Express middleware.'
    if (p.startsWith('server/utils')) return 'Backend utility helpers.'
    if (p === 'python_backend') return 'Flask-based Python agent.'
    if (p.endsWith('venv')) return 'Python virtual environment (listed but not traversed).'
    if (p.endsWith('__pycache__')) return 'Python bytecode cache (listed but not traversed).'
    if (p === 'scripts') return 'Automation and documentation generators.'
    return 'Directory.'
  }
  // Files
  if (p === '.gitignore') return 'Git ignore rules.'
  if (p === 'readme.md') return 'Project overview and setup.'
  if (p === 'package.json') return 'Root workspace configuration and scripts.'
  if (p === 'package-lock.json') return 'Dependency lock file.'
  if (p === 'test-login.html') return 'Manual login test page.'
  if (p === 'project_details.docx') return 'Generated technical overview document.'
  if (p === 'project_details_updated.docx') return 'Alternate generated overview when file is locked.'

  if (p === 'client/index.html') return 'Vite HTML entry for the frontend.'
  if (p === 'client/package.json') return 'Frontend dependencies and scripts.'
  if (p === 'client/package-lock.json') return 'Frontend dependency lock.'
  if (p === 'client/tailwind.config.js') return 'Tailwind configuration (dark mode: class).'
  if (p === 'client/postcss.config.js') return 'PostCSS plugin configuration.'
  if (p === 'client/vite.config.js') return 'Vite dev server and proxy config.'
  if (p === 'client/readme.md') return 'Frontend project notes.'
  if (p === 'client/src/app.jsx') return 'App routes and base layout.'
  if (p === 'client/src/main.jsx') return 'React bootstrap and providers.'
  if (p === 'client/src/index.css') return 'Global styles and Tailwind layer definitions.'
  if (p === 'client/src/services/api.js') return 'HTTP client and API endpoints.'
  if (p.includes('client/src/contexts/authcontext.jsx')) return 'Authentication context and token handling.'
  if (p.includes('client/src/contexts/themecontext.jsx')) return 'Theme context managing Light/Dark/System modes.'

  if (p === 'server/app.js') return 'Express app initialization, DB connect, middleware, and route mounting.'
  if (p === 'server/package.json') return 'Backend dependencies and scripts.'
  if (p === 'server/package-lock.json') return 'Backend dependency lock.'
  if (p === 'server/readme.md') return 'Backend usage and environment configuration.'
  if (p === 'server/.env') return 'Backend environment variables (sensitive).'
  if (p === 'server/.env.example') return 'Sample backend environment variable keys.'
  if (p === 'server/middleware/auth.js') return 'JWT authentication and authorization middleware.'
  if (p === 'server/utils/mailer.js') return 'SendGrid mailer utility.'
  if (p === 'server/seedresources.js') return 'Seed script for Resources collection.'
  if (p === 'server/seedcounselors.js') return 'Seed script for Counselors collection.'
  if (p.startsWith('server/test-')) return 'Diagnostic test script for external API integrations.'
  if (p.startsWith('server/models/')) return `Mongoose model for ${path.basename(p, '.js')}.`
  if (p.startsWith('server/routes/')) return `Express router for ${path.basename(p, '.js')} endpoints.`

  if (p === 'python_backend/app.py') return 'Flask app integrating Google Generative AI and chat.'
  if (p === 'python_backend/requirements.txt') return 'Python dependencies.'
  if (p === 'python_backend/test_health.py') return 'Health check unit test.'
  if (p === 'python_backend/.env') return 'Python agent environment variables.'
  if (p === 'python_backend/readme.md') return 'Python agent usage and notes.'

  if (p === 'scripts/generate-project-doc.mjs') return 'Generator for Project_Details.docx.'
  if (p === 'scripts/generate-project-doc2.mjs') return 'Generator for Project_Details_2.docx.'

  if (p.startsWith('~$')) return 'Temporary Office lock file.'
  return 'Source file.'
}

async function main() {
  const children = [
    new Paragraph({ text: 'Project Details 2 – Files and Responsibilities', heading: HeadingLevel.TITLE }),
    new Paragraph({ text: 'Generated on ' + new Date().toLocaleString() }),
    new Paragraph({ text: 'Note: node_modules directories are excluded.' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Files', heading: HeadingLevel.HEADING_2 }),
  ]

  const items = listPaths(ROOT, ROOT, 0, 4)
  const routesGrouped = parseRoutesGrouped()

  for (const { rel, isDir } of items) {
    const desc = describe(rel, isDir)
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [
          new TextRun({ text: rel + ' — ', bold: true }),
          new TextRun({ text: desc })
        ]
      })
    )

    if (!isDir && rel.replace(/\\/g, '/').startsWith('server/routes/')) {
      const eps = routesGrouped[rel.replace(/\\/g, '/')] || []
      if (eps.length) {
        children.push(new Paragraph({ text: 'Endpoints:', bullet: { level: 1 } }))
        for (const ep of eps) {
          children.push(new Paragraph({ text: ep, bullet: { level: 2 } }))
        }
      }
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] })

  const buffer = await Packer.toBuffer(doc)
  const outPath = path.join(ROOT, 'Project_Details_2.docx')
  try {
    fs.writeFileSync(outPath, buffer)
    console.log('Generated:', outPath)
  } catch (err) {
    const altPath = path.join(ROOT, 'Project_Details_2_updated.docx')
    fs.writeFileSync(altPath, buffer)
    console.log('Generated (alternate):', altPath)
  }
}

main().catch(err => {
  console.error('Failed to generate document:', err)
  process.exit(1)
})