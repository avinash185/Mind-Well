import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  TableOfContents,
} from "docx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const docsDir = path.join(rootDir, "docs");
const outPath = path.join(docsDir, "Project_Report.docx");
const fallbackOutPath = path.join(docsDir, "Project_Report_updated.docx");

function ensureDirs() {
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
}

function H(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { after: 200 } });
}

function P(text, opts = {}) {
  const {
    bold = false,
    italics = false,
    breakBefore = false,
    align = AlignmentType.JUSTIFIED,
    size = 24, // 12pt
  } = opts;
  return new Paragraph({
    children: [new TextRun({ text, bold, italics, size, font: "Times New Roman" })],
    pageBreakBefore: !!breakBefore,
    alignment: align,
    spacing: { after: 120 },
  });
}

function Bullet(text) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 60 },
  });
}

function LabelValue(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 26, font: "Times New Roman" }),
      new TextRun({ text: value, size: 26, font: "Times New Roman" }),
    ],
    spacing: { after: 80 },
  });
}

function TechnologyTable() {
  return new Table({
    width: { size: 100, type: "pct" },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Layer", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Technologies", bold: true })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Frontend")] }),
          new TableCell({ children: [new Paragraph("React.js, Vite, CSS, JavaScript")] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Backend")] }),
          new TableCell({ children: [new Paragraph("Node.js, Express.js, Mongoose (MongoDB)")] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Database")] }),
          new TableCell({ children: [new Paragraph("MongoDB")] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("AI Integration")] }),
          new TableCell({ children: [new Paragraph("Python, Flask, Google Generative AI (Gemini API)")] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Additional")] }),
          new TableCell({ children: [new Paragraph("Nodemailer, Axios, CORS, JWT Authentication, Dotenv")] }),
        ],
      }),
    ],
  });
}

function makeHeaderFooter() {
  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Mental Health and Well-being Support Agentic AI", italics: true })],
      }),
    ],
  });
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun("Page "),
          PageNumber.CURRENT,
          new TextRun(" of "),
          PageNumber.TOTAL_PAGES,
        ],
      }),
    ],
  });
  return { header, footer };
}

function addArchitectureImageIfAvailable(children) {
  const imgPath = path.join(docsDir, "architecture.png");
  if (fs.existsSync(imgPath)) {
    try {
      const data = fs.readFileSync(imgPath);
      children.push(P("Figure 1: System Architecture Diagram", { italics: true }));
      children.push(
        new Paragraph({
          children: [new ImageRun({ data, transformation: { width: 800, height: 450 } })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    } catch (e) {
      children.push(P(`(Diagram available at ${imgPath}, but failed to embed)`));
    }
  } else {
    children.push(P("(Add diagram at docs/architecture.png to embed it here.)", { italics: true }));
  }
}

async function main() {
  ensureDirs();
  const today = new Date().toLocaleDateString();

  const { header, footer } = makeHeaderFooter();

  const children = [];

  // Cover Page
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({ text: "Mental Health and Well-being Support Agentic AI", bold: true, size: 56, font: "Times New Roman" }),
      ],
    })
  );
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Project Report", size: 36 })], spacing: { after: 300 } }));
  children.push(LabelValue("Author", "Avinash M"));
  children.push(LabelValue("Roll No", "______________"));
  children.push(LabelValue("Department", "______________"));
  children.push(LabelValue("College", "______________"));
  children.push(LabelValue("University", "______________"));
  children.push(LabelValue("Supervisor", "______________"));
  children.push(LabelValue("Date of Submission", "______________"));
  children.push(P(`(Generated on ${today})`));

  // Page break before TOC
  children.push(new Paragraph({ children: [new TextRun("")], pageBreakBefore: true }));

  // Table of Contents
  children.push(H("Table of Contents", HeadingLevel.HEADING_1));
  children.push(
    new TableOfContents("", { hyperlink: true, headingStyleRange: "1-5" })
  );

  // Sections
  children.push(new Paragraph({ children: [new TextRun("")], pageBreakBefore: true }));

  // 1. Abstract
  children.push(H("1. Abstract"));
  children.push(
    P(
      "This project aims to create an AI-powered mental health and well-being support system that allows users to interact with an intelligent agent for emotional support and self-care guidance. Built using React for the frontend, Node.js and Express for the backend, MongoDB for database management, and Python integrated with the Gemini API for natural language understanding, the system provides personalized conversations, appointment booking with counselors, and well-being tracking. The goal is to enhance mental health accessibility through intelligent, empathetic AI support."
    )
  );

  // 2. Introduction
  children.push(H("2. Introduction"));
  children.push(P("The rise of mental health concerns worldwide has highlighted the need for accessible, scalable, and empathetic support systems. Many individuals face barriers to care, including stigma, cost, and availability of professionals."));
  children.push(P("Agentic AI systems can provide always-available assistance, helping users reflect, self-regulate, and access resources. This project explores such a system, combining an LLM-powered agent with secure backend services and a responsive web interface."));
  children.push(P("Motivation includes improving access, reducing wait times, and augmenting professional care with supportive, privacy-aware tools."));

  // 3. Objectives
  children.push(H("3. Objectives"));
  [
    "Design an intelligent agent capable of responding empathetically to users",
    "Integrate a real-time counseling request and booking feature",
    "Securely manage user and counselor data",
    "Implement an interactive web interface using React",
    "Ensure privacy and security in user communications",
  ].forEach((o) => children.push(Bullet(o)));

  // 4. System Architecture / Methodology
  children.push(H("4. System Architecture / Methodology"));
  children.push(P("Frontend: React.js for UI"));
  children.push(P("Backend: Node.js + Express for API endpoints"));
  children.push(P("Database: MongoDB for storing user, counselor, and session data"));
  children.push(P("AI Agent: Python (Flask) with Gemini API for NLU/NLG"));
  children.push(P("Integration: Communication between backend and AI agent via REST"));
  children.push(P("Flow: [User] → [React Frontend] → [Express Server] → [Python Agent + Gemini API] → [Response]; MongoDB supports persistence."));
  addArchitectureImageIfAvailable(children);

  // 5. Modules / Features
  children.push(H("5. Modules / Features"));
  [
    "User Authentication (Login/Signup) with JWT",
    "AI Chat Support (Gemini API-based agent)",
    "Counselor Management (stored in MongoDB)",
    "Counseling Session Booking",
    "Email Notification System (SendGrid/Nodemailer)",
    "Admin Dashboard (optional)",
  ].forEach((m) => children.push(Bullet(m)));
  children.push(P("Each module integrates with the core API and contributes to the user experience for guidance, triage, and follow-up."));

  // 6. Technologies Used
  children.push(H("6. Technologies Used"));
  children.push(TechnologyTable());

  // 7. Implementation
  children.push(H("7. Implementation"));
  children.push(P("The frontend collects messages and routes agent queries to the Flask service via the dev proxy at /agent. The Node API manages users, sessions, and auxiliary workflows (e.g., email)."));
  children.push(P("Example Node → Python data flow:"));
  children.push(P("POST client:/agent/chat  →  Flask:/chat  →  LLM → JSON response", { italics: true }));
  children.push(P("Example backend API usage:"));
  children.push(P("GET client:/api/health  →  Express:/api/health  →  200 OK", { italics: true }));
  children.push(P("Database schemas (e.g., User, Session) define core entities and are persisted via Mongoose."));

  // 8. Results / Output
  children.push(H("8. Results / Output"));
  [
    "Chat interface renders AI responses and supports iterative conversations",
    "Counselor booking flow returns confirmations",
    "Agent health and API health endpoints report service status",
    "MongoDB collections store users, sessions, and resources",
  ].forEach((r) => children.push(Bullet(r)));
  children.push(P("(Insert screenshots of chat, booking confirmations, and DB entries here.)", { italics: true }));

  // 9. Conclusion
  children.push(H("9. Conclusion"));
  children.push(P("The system demonstrates an integrated Agentic AI approach for accessible mental health support, combining an LLM agent with secure backend services and a modern web UI. It offers a foundation for empathetic, available assistance and can augment professional support."));

  // 10. Future Scope
  children.push(H("10. Future Scope"));
  [
    "Integrate voice-based emotional analysis",
    "Add multi-language support",
    "Use sentiment analysis for more empathetic responses",
    "Build a mobile app version",
    "Enhance long-term memory and retrieval",
  ].forEach((f) => children.push(Bullet(f)));

  // 11. References
  children.push(H("11. References"));
  [
    "Gemini API documentation",
    "React, Node.js, Express, MongoDB official docs",
    "Research on AI for mental health and digital therapeutics",
  ].forEach((ref) => children.push(Bullet(ref)));

  const doc = new Document({
    features: { updateFields: true },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children,
      },
    ],
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    try {
      fs.writeFileSync(outPath, buffer);
      console.log(`Project report generated: ${outPath}`);
    } catch (e) {
      if (e && e.code === "EBUSY") {
        fs.writeFileSync(fallbackOutPath, buffer);
        console.log(`Primary file busy. Wrote to: ${fallbackOutPath}`);
      } else {
        throw e;
      }
    }
  } catch (err) {
    console.error("Error generating report:", err);
    process.exit(1);
  }
}

main();