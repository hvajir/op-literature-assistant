import { useState, useEffect, useCallback, useRef } from "react";
import JSZip from "jszip";

const lsGet = (k) => {
  try {
    return localStorage.getItem(k);
  } catch (e) {
    return null;
  }
};
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch (e) {}
};

// ── Derive AI relevance from keyword text ────────────────────────
// No more hardcoded aiFlag — if the keyword contains these terms
// it's treated as AI-related and gets unfiltered journal results.
const AI_TERMS = [
  "ai ",
  "ai-",
  " ai",
  "artificial intelligence",
  "algorithmic",
  "agentic",
  "generative ai",
  "human-ai",
];
function isAiKeyword(kw) {
  const lower = kw.toLowerCase();
  return AI_TERMS.some((t) => lower.includes(t));
}

// ── Target journals ──────────────────────────────────────────────
// Applied to non-AI keywords only. AI keywords are unfiltered.
const TARGET_JOURNALS = [
  // ── Administrative Science Quarterly ────────────────────────────
  "administrative science quarterly",
  "adm. sci. q.",
  "adm sci q",
  "admin. sci. q.",
  "admin sci q",
  "asq",

  // ── Academy of Management Journal ───────────────────────────────
  "academy of management journal",
  "acad. manage. j.",
  "acad manage j",
  "acad. manag. j.",
  "amj",
  "the academy of management journal",

  // ── Academy of Management Review ────────────────────────────────
  "academy of management review",
  "acad. manage. rev.",
  "acad manage rev",
  "amr",
  "the academy of management review",

  // ── Academy of Management Perspectives ──────────────────────────
  "academy of management perspectives",
  "acad. manage. perspect.",
  "acad manage perspect",
  "amp",

  // ── Organization Science ─────────────────────────────────────────
  "organization science",
  "organ. sci.",
  "organ sci",
  "org. sci.",
  "org sci",

  // ── Management Science ───────────────────────────────────────────
  "management science",
  "manage. sci.",
  "manage sci",
  "manag. sci.",
  "mgmt. sci.",
  "mgmt sci",

  // ── MIS Quarterly ────────────────────────────────────────────────
  "mis quarterly",
  "mis q.",
  "mis q",
  "misq",

  // ── ILR Review ───────────────────────────────────────────────────
  "ilr review",
  "ilr rev.",
  "ind. labor relat. rev.",
  "ind labor relat rev",
  "industrial and labor relations review",

  // ── Work and Occupations ─────────────────────────────────────────
  "work and occupations",
  "work occup.",
  "work occup",

  // ── New Technology Work and Employment ──────────────────────────
  "new technology work and employment",
  "new technol. work employ.",
  "new technol work employ",

  // ── Harvard Business Review ──────────────────────────────────────
  "harvard business review",
  "harv. bus. rev.",
  "harv bus rev",
  "hbr",
  "harvard business review for educators",
  "hbr for educators",

  // ── MIT Sloan Management Review ──────────────────────────────────
  "mit sloan management review",
  "sloan management review",
  "mit sloan manage. rev.",
  "sloan manage. rev.",
  "sloan manag rev",

  // ── California Management Review ─────────────────────────────────
  "california management review",
  "calif. manage. rev.",
  "calif manage rev",
  "cmr",

  // ── Journal of Organizational Behavior ──────────────────────────
  "journal of organizational behavior",
  "j. organ. behav.",
  "j organ behav",
  "j. org. behav.",
  "j org behav",
  "j. organiz. behav.",
  "job",
  "the journal of organizational behavior",

  // ── Journal of Applied Psychology ───────────────────────────────
  "journal of applied psychology",
  "j. appl. psychol.",
  "j appl psychol",
  "j. appl. psych.",
  "the journal of applied psychology",

  // ── Strategic Management Journal ─────────────────────────────────
  "strategic management journal",
  "strateg. manage. j.",
  "strateg manage j",
  "strat. manage. j.",
  "strat manage j",
  "smj",

  // ── Journal of Management ────────────────────────────────────────
  "journal of management",
  "j. manage.",
  "j manage",
  "j. manag.",
  "the journal of management",

  // ── Journal of Management Studies ────────────────────────────────
  "journal of management studies",
  "j. manage. stud.",
  "j manage stud",
  "j. manag. stud.",
  "jms",
  "the journal of management studies",

  // ── Personnel Psychology ─────────────────────────────────────────
  "personnel psychology",
  "pers. psychol.",
  "pers psychol",

  // ── Human Relations ──────────────────────────────────────────────
  "human relations",
  "hum. relat.",
  "hum relat",

  // ── British Journal of Industrial Relations ──────────────────────
  "british journal of industrial relations",
  "br. j. ind. relat.",
  "br j ind relat",
  "bjir",

  // ── Journal of Labor Economics ───────────────────────────────────
  "journal of labor economics",
  "j. labor econ.",
  "j labor econ",

  // ── Computers in Human Behavior ──────────────────────────────────
  "computers in human behavior",
  "comput. hum. behav.",
  "comput hum behav",

  // ── Human Resource Management ────────────────────────────────────
  "human resource management",
  "hum. resour. manage.",
  "hum resour manage",
  "hrm",

  // ── Organizational Behavior and Human Decision Processes ─────────
  "organizational behavior and human decision processes",
  "organ. behav. hum. decis. process.",
  "organ behav hum decis process",
  "obhdp",

  // ── Journal of Occupational and Organizational Psychology ────────
  "journal of occupational and organizational psychology",
  "j. occup. organ. psychol.",
  "j occup organ psychol",
  "joop",

  // ── Information Systems Research ─────────────────────────────────
  "information systems research",
  "inf. syst. res.",
  "inf syst res",
  "isr",

  // ── Journal of the Association for Information Systems ───────────
  "journal of the association for information systems",
  "j. assoc. inf. syst.",
  "j assoc inf syst",
  "jais",

  // ── Work Employment and Society ──────────────────────────────────
  "work employment and society",
  "work employ. soc.",
  "work employ soc",

  // ── Economic and Industrial Democracy ────────────────────────────
  "economic and industrial democracy",
  "econ. ind. democr.",
  "econ ind democr",

  // ── Labour Economics ─────────────────────────────────────────────
  "labour economics",
  "labour econ.",
  "labour econ",

  // ── Industrial Relations ─────────────────────────────────────────
  "industrial relations",
  "ind. relat.",
  "ind relat",
  "industrial relations: a journal of economy and society",

  // ── Journal of Business and Psychology ───────────────────────────
  "journal of business and psychology",
  "j. bus. psychol.",
  "j bus psychol",

  // ── Group and Organization Management ────────────────────────────
  "group and organization management",
  "group organ. manage.",
  "group organ manage",
  "gom",
];

function matchesTargetJournal(venue) {
  if (!venue) return false;
  // Normalize: lowercase, strip parenthetical suffixes and trailing punctuation
  const v = venue
    .toLowerCase()
    .replace(/\s*\(.*\)\s*$/, "")
    .replace(/[.]+\s*$/, "")
    .trim();
  return TARGET_JOURNALS.some((j) => v === j || v.startsWith(j + " "));
}

// ── Off-topic journal blocklist (applied to all keywords) ────────
const EXCLUDED_JOURNAL_TERMS = [
  // Medical / health
  "bmj",
  "lancet",
  "jama",
  "new england journal of medicine",
  "plos medicine",
  "plos one",
  "plos biology",
  "global health",
  "clinical",
  "medical journal",
  "public health",
  "epidemiology",
  "nursing",
  "pharmacy",
  "oncology",
  "radiology",
  "psychiatry",
  "neurology",
  "cardiology",
  "pediatrics",
  "surgery",
  "annals of medicine",
  "infectious disease",
  "diagnostic microbiology",
  "medical ethics",
  "journal of medical",
  "indian journal of medical",
  // Occupational health & therapy (NOT the same as organizational behavior)
  "occupational therapy",
  "occupational health",
  "occupational medicine",
  "occupational science",
  "journal of occupational medicine",
  "journal of occupational health",
  "american journal of occupational",
  // Natural sciences / biotech
  "physical review",
  "journal of physics",
  "journal of chemistry",
  "journal of biology",
  "bioinformatics",
  "genomics",
  "ecology letters",
  "geophysics",
  "astrophysics",
  "crystallography",
  "biotechnology",
  "bioresource",
  "bioengineering",
  "lab on a chip",
  "virology",
  "viruses",
  "cell biology",
  "biochemistry",
  "molecular biology",
  // Engineering & logistics
  "ieee transactions",
  "acm transactions on",
  "mechanical engineering",
  "electrical engineering",
  "chemical engineering",
  "civil engineering",
  "robotics",
  "signal processing",
  "logistics management",
  "supply chain management",
  "international journal of logistics",
  // Sports & agriculture
  "sports science",
  "sports coaching",
  "sport science",
  "agromedicine",
  "journal of agromedicine",
  "exercise science",
  "kinesiology",
  // Low-quality / predatory signals
  "extreme anthropology",
  "advances in social sciences research journal",
  "international journal of scientific research in engineering",
  "advances in human resource management research",
  "journal of extreme",
];

// ── OB topic signals (required for AI keyword results) ───────────
const OB_TOPIC_SIGNALS = [
  "organiz",
  "workplace",
  "firm",
  "manag",
  "employ",
  "labor relation",
  "labour relation",
  "team dynamic",
  "leadership",
  "power",
  "institution",
  "hierarch",
  "coordinat",
  "collaborat",
  "strateg",
  "human resource",
  "talent",
  "profession",
  "career",
  "corporate",
  "business enterprise",
  "executive",
  "worker",
  "gig work",
  "gig econom",
  "platform work",
  "platform labor",
  "crowd work",
  "crowdwork",
  "algorith",
];

function isExcludedJournal(venue) {
  if (!venue) return false;
  const v = venue.toLowerCase();
  return EXCLUDED_JOURNAL_TERMS.some((t) => v.includes(t));
}

function hasOBTopicSignal(paper) {
  const text = (paper.title + " " + (paper.abstract || "")).toLowerCase();
  return OB_TOPIC_SIGNALS.some((s) => text.includes(s));
}

function isRelevantAiPaper(paper) {
  const venue = (paper.venue || "").toLowerCase();
  const isPreprint =
    venue.includes("arxiv") ||
    venue.includes("ssrn") ||
    venue.includes("preprint") ||
    venue.includes("working paper");
  // Must be from a target journal OR a preprint server (AND have OB signals)
  return (
    (matchesTargetJournal(paper.venue) || isPreprint) && hasOBTopicSignal(paper)
  );
}

// ── Practitioner journals for CrossRef ──────────────────────────
const PRACTITIONER_JOURNALS = [
  "harvard business review",
  "sloan management review",
  "mit sloan management review",
  "california management review",
  "hbr",
];

// ── Parse .docx using JSZip ──────────────────────────────────────
async function parseDocxFile(file) {
  const ab = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(ab);
  const xmlFile = zip.file("word/document.xml");
  if (!xmlFile) throw new Error("Not a valid .docx file");
  const xmlStr = await xmlFile.async("string");
  const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
  const styleRegex = /<w:pStyle w:val="([^"]+)"/;
  const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  const sections = [];
  let currentSection = null;
  const paras = xmlStr.match(paraRegex) || [];
  for (const para of paras) {
    const styleMatch = para.match(styleRegex);
    const style = styleMatch ? styleMatch[1] : "";
    let text = "",
      m;
    while ((m = textRegex.exec(para)) !== null) text += m[1];
    textRegex.lastIndex = 0;
    text = text.trim();
    if (!text) continue;
    const isHeading = /heading|title/i.test(style) && style !== "Normal";
    if (isHeading) {
      currentSection = { heading: text, paragraphs: [] };
      sections.push(currentSection);
    } else if (text.length > 30) {
      if (!currentSection) {
        currentSection = { heading: "Introduction", paragraphs: [] };
        sections.push(currentSection);
      }
      currentSection.paragraphs.push(text);
    }
  }
  return sections.filter((s) => s.paragraphs.length > 0);
}

// ── Extract text from uploaded PDF ──────────────────────────────
async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Could not load PDF reader"));
      document.head.appendChild(s);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const ab = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: ab }).promise;
  let text = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text.trim().slice(0, 10000);
}

function fuzzyMatchSection(heading, sectionsOrder) {
  const h = heading.toLowerCase();
  for (const key of sectionsOrder) {
    const words = key
      .toLowerCase()
      .replace(/[§\d]/g, "")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    if (words.some((w) => h.includes(w))) return key;
  }
  return null;
}

function extractClaimsFromDoc(uploadedDoc, sectionKey, sectionsOrder) {
  if (!uploadedDoc || !uploadedDoc.sections) return null;
  for (const sec of uploadedDoc.sections) {
    const matched = fuzzyMatchSection(sec.heading, sectionsOrder);
    if (matched === sectionKey) {
      const claims = [];
      for (const para of sec.paragraphs) {
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
        claims.push(
          ...sentences.map((s) => s.trim()).filter((s) => s.length > 40)
        );
      }
      return claims.slice(0, 8);
    }
  }
  return null;
}

// ── Keywords — 18 per lens, tested against OpenAlex Jan 2026 ─────
const LENS_KEYWORDS = {
  structural: [
    // §1 Grouping
    { kw: "divisional organization firm performance", section: "§1 Grouping" },
    {
      kw: "matrix organization management challenges",
      section: "§1 Grouping",
      crossRefFlag: true,
    },
    {
      kw: "generative AI organizational structure",
      section: "§1 Grouping",
      crossRefFlag: true,
    },
    // §2 Linking
    { kw: "boundary spanning teams organizations", section: "§2 Linking" },
    {
      kw: "cross-functional coordination management",
      section: "§2 Linking",
      crossRefFlag: true,
    },
    {
      kw: "human-AI collaboration performance",
      section: "§2 Linking",
      crossRefFlag: true,
    },
    // §3 Aligning
    {
      kw: "job design autonomy employee engagement",
      section: "§3 Aligning",
      crossRefFlag: true,
    },
    { kw: "incentive pay performance management", section: "§3 Aligning" },
    {
      kw: "algorithmic management employee fairness",
      section: "§3 Aligning",
      crossRefFlag: true,
    },
    // §4 Redesign
    { kw: "organizational redesign employee stress", section: "§4 Redesign" },
    {
      kw: "organizational change strategic fit",
      section: "§4 Redesign",
      crossRefFlag: true,
    },
    {
      kw: "AI organizational restructuring",
      section: "§4 Redesign",
      crossRefFlag: true,
    },
    // §5 Less-hierarchical
    {
      kw: "self-managing teams effectiveness",
      section: "§5 Less-hierarchical",
      crossRefFlag: true,
    },
    {
      kw: "holacracy decentralized organizations",
      section: "§5 Less-hierarchical",
    },
    {
      kw: "AI team decision making management",
      section: "§5 Less-hierarchical",
      crossRefFlag: true,
    },
    // §6 Crowd-centric
    {
      kw: "platform work employment regulation",
      section: "§6 Crowd-centric",
      crossRefFlag: true,
    },
    { kw: "crowdwork organization complex tasks", section: "§6 Crowd-centric" },
    {
      kw: "algorithmic gig platform management",
      section: "§6 Crowd-centric",
      crossRefFlag: true,
    },
  ],
  cultural: [
    // Meaning & Symbols
    {
      kw: "organizational symbolism employee behavior",
      section: "Meaning & Symbols",
      crossRefFlag: true,
    },
    {
      kw: "AI automation work meaningfulness",
      section: "Meaning & Symbols",
      crossRefFlag: true,
    },
    // Habits & History
    {
      kw: "organizational inertia institutional change",
      section: "Habits & History",
      crossRefFlag: true,
    },
    {
      kw: "AI cultural change resistance",
      section: "Habits & History",
      crossRefFlag: true,
    },
    // Identity
    {
      kw: "professional identity work role",
      section: "Identity",
      crossRefFlag: true,
    },
    { kw: "gig work identity precarious", section: "Identity" },
    {
      kw: "AI occupational identity threat",
      section: "Identity",
      crossRefFlag: true,
    },
    // Subcultures
    {
      kw: "occupational subculture collaboration",
      section: "Subcultures",
      crossRefFlag: true,
    },
    {
      kw: "AI adoption organizational subcultures",
      section: "Subcultures",
      crossRefFlag: true,
    },
    // Cross-Cultural Dynamics
    {
      kw: "cross-cultural team performance management",
      section: "Cross-Cultural Dynamics",
      crossRefFlag: true,
    },
    { kw: "global virtual team identity", section: "Cross-Cultural Dynamics" },
    {
      kw: "AI cross-cultural communication teams",
      section: "Cross-Cultural Dynamics",
      crossRefFlag: true,
    },
    // Culture, Control & Motivation
    {
      kw: "privacy transparency employee performance",
      section: "Culture, Control & Motivation",
      crossRefFlag: true,
    },
    {
      kw: "concertive control self-managing teams",
      section: "Culture, Control & Motivation",
    },
    {
      kw: "algorithmic surveillance worker control",
      section: "Culture, Control & Motivation",
      crossRefFlag: true,
    },
    // Future of Culture
    {
      kw: "crowdwork labor conditions platform",
      section: "Future of Culture",
      crossRefFlag: true,
    },
    {
      kw: "AI ghost work platform",
      section: "Future of Culture",
      crossRefFlag: true,
    },
    {
      kw: "culture motivation employee socialization",
      section: "Culture, Control & Motivation",
      crossRefFlag: true,
    },
  ],
  political: [
    // Positional Power
    {
      kw: "managerial authority coercion resistance",
      section: "Positional Power",
      crossRefFlag: true,
    },
    {
      kw: "algorithmic management worker authority",
      section: "Positional Power",
      crossRefFlag: true,
    },
    // Personal Power
    {
      kw: "data analytics organizational decision-making",
      section: "Personal Power",
      crossRefFlag: true,
    },
    {
      kw: "expert power influence workplace",
      section: "Personal Power",
      crossRefFlag: true,
    },
    {
      kw: "generative AI worker expertise power",
      section: "Personal Power",
      crossRefFlag: true,
    },
    // Network Power
    { kw: "network brokerage structural holes", section: "Network Power" },
    {
      kw: "organizational social networks brokerage",
      section: "Network Power",
      crossRefFlag: true,
    },
    {
      kw: "AI social network workplace",
      section: "Network Power",
      crossRefFlag: true,
    },
    // Interests & Stakeholders
    {
      kw: "stakeholder management organizational change",
      section: "Interests & Stakeholders",
      crossRefFlag: true,
    },
    {
      kw: "worker AI resistance organizations",
      section: "Interests & Stakeholders",
      crossRefFlag: true,
    },
    // Building a Network
    {
      kw: "developmental network mentoring sponsorship",
      section: "Building a Network",
      crossRefFlag: true,
    },
    {
      kw: "network reciprocity trust organizations",
      section: "Building a Network",
    },
    {
      kw: "AI career professional development",
      section: "Building a Network",
      crossRefFlag: true,
    },
    // Using Power & Influence
    {
      kw: "stakeholder mapping organizational change",
      section: "Using Power & Influence",
      crossRefFlag: true,
    },
    {
      kw: "AI adoption resistance organizations",
      section: "Using Power & Influence",
      crossRefFlag: true,
    },
    // Future of Organizational Power
    {
      kw: "digital platform worker voice",
      section: "Future of Organizational Power",
      crossRefFlag: true,
    },
    {
      kw: "gig worker collective action power",
      section: "Future of Organizational Power",
      crossRefFlag: true,
    },
    {
      kw: "AI worker power governance",
      section: "Future of Organizational Power",
      crossRefFlag: true,
    },
  ],
};

const LENS_LABELS = {
  structural: "Structural Design",
  cultural: "Cultural",
  political: "Political",
};

const SECTION_CLAIMS = {
  "§1 Grouping": [
    '"Historically, organizations have used three basic forms or ideal types of grouping: functional structure, divisional structure, or matrix structure."',
    '"Coordination and communication are easier and denser within a unit than across units."',
    '"Career ladders are primarily within functions... there is a tendency for the number of levels of management in each function to expand over time."',
  ],
  "§2 Linking": [
    '"It is now commonplace for employees to spend significant amounts of their day collaborating using video conferencing technologies."',
    '"Managers are using social media technologies to engage the entire organization in collective conversations."',
    '"Liaisons serve as conduits for information and expertise."',
    '"Organizations can also use special groups such as X-teams and task forces to link units."',
  ],
  "§3 Aligning": [
    '"Variable pay should reward performance that is easy to measure, clear to the employee, and controllable by the employee."',
    '"When performance measures are incomplete, they drive behavior that is not perfectly aligned with organizational goals."',
    '"Seven key work design factors: clear goals, autonomy, resources, low time pressure, right help, psychological safety, and voice."',
  ],
  "§4 Redesign": [
    '"The most frequent stimulus to organizational design change is that the current design no longer fits the pressures from the external business environment."',
    '"One key cost of redesign is stress and anxiety for employees."',
    '"A key cost of redesign is the disruption of informal systems and processes."',
  ],
  "§5 Less-hierarchical": [
    '"Zappos adopted holacracy." / "Medium dropped holacracy, noting it was difficult to coordinate efforts at scale."',
    '"Pressure from peers can actually be more stressful for employees than that from bosses."',
    '"Ambiguity and lack of clarity around progression, compensation and responsibilities led Zappos employees to leave."',
  ],
  "§6 Crowd-centric": [
    '"Platforms define themselves as neutral intermediaries not employers and thus bypass employment regulations."',
    '"Flash organizations: crowds structured like organizations to achieve complex and open-ended goals."',
    '"Microwork platforms like Amazon Mechanical Turk focus on relatively simple, repetitive tasks."',
  ],
  "Meaning & Symbols": [
    '"Culture provides a template on which meanings are read and actions are based."',
    '"Symbols are vehicles for meaning... decoding what a symbol means to a specific group is what cultural analysis is all about."',
    '"The same symbol can have different meanings for different groups within a single organization."',
  ],
  "Habits & History": [
    '"Culture emerges slowly and unevenly... built on traditions and the experience of success."',
    '"Even when regulation prohibited long working hours, many interns continued to work them willingly — because they embraced the surgical iron man identity."',
  ],
  Identity: [
    '"Work is a key source of identity for people, and scholars have shown how the workplace is an identity workspace for many workers."',
    '"Changes in work that may seem minor for outsiders can deeply affect the identities of those performing the work."',
  ],
  Subcultures: [
    '"Subcultures are present in every organization... groups of people who share common identities based on characteristics that often transcend their organizationally prescribed roles."',
    '"Engineers and marketers within the same company often have distinctive subcultures."',
  ],
  "Cross-Cultural Dynamics": [
    '"Despite attempts to leverage communication technologies to keep workers connected, subcultures often form in different locations."',
    '"Research suggests that having team members meet in person and building a shared team identity can help."',
  ],
  "Culture, Control & Motivation": [
    '"Managers often attempt to increase worker motivation by providing socialization and symbols that reinforce the values they hope employees will internalize."',
    '"Maintaining observability of workers may counterintuitively reduce their performance — creating a transparency paradox."',
    '"The attempt to loosen bureaucratic control ended up tightening the iron cage through a system of peer-based control."',
  ],
  "Future of Culture": [
    '"A host of changes, many technological, have given rise to a gig economy."',
    '"Workers may experience algorithmic cruelty: hypervigilance despite claims of flexibility, isolation despite claims of autonomy."',
  ],
  "Positional Power": [
    '"Positional power is power stemming from formal hierarchical position... based on control over resource allocation, information flows, performance evaluation, and task assignments."',
    '"Excessive reliance on sanctions can transform authority into coercion, which is rarely accepted as legitimate."',
  ],
  "Personal Power": [
    '"Expertise — the mastery of a skill or body of knowledge that is both valued by the organization and relatively scarce — can be a significant source of power."',
    '"Track record, or past performance, is another source of personal power."',
    '"Today, we see a similar phenomenon occurring with individuals or subunits involved in data analytics."',
  ],
  "Network Power": [
    '"Know-who is as important as know-how in any organization."',
    '"As organizations become increasingly flat and distributed, the kind of influence that comes from social networks is often much more significant than authority from formal hierarchical position."',
    '"Acting as the informal bridge or broker connecting individuals or units across structural holes in a network is a significant source of power."',
  ],
  "Interests & Stakeholders": [
    '"The political perspective broadens the scope of interests beyond what can be calculated in economic terms to include autonomy and status."',
    '"Interests are both complex and dynamic... they change in content and in relative importance over time."',
  ],
  "Building a Network": [
    '"An effective network extends in three directions: upward, horizontally, and downward."',
    '"It is important to build ties before you need them, to make networking a way of life."',
  ],
  "Using Power & Influence": [
    '"Those who are effective in organizations engage in stakeholder mapping, understand sources of resistance, and tailor influence tactics to particular stakeholders."',
  ],
  "Future of Organizational Power": [
    '"Social media are having a transformative effect on society... changing relationships between organizational actors and outside stakeholders."',
    '"New power is more like a current: made by many, participatory and peer-driven."',
    '"It is unclear whether the introduction of new technologies will facilitate a high degree of organizational or societal change."',
  ],
};

const READING_SECTIONS_BY_LENS = {
  structural: {
    "§1 Grouping": {
      heading: "Grouping: Division of labor",
      paragraphs: [
        "Grouping decisions dictate the basic framework within which all other organizational design decisions are made. A fundamental assumption of the structural design approach is that coordination and communication are easier and denser within a unit than across units.",
        "Historically, organizations have used three basic forms or ideal types of grouping: functional structure, divisional structure, or matrix structure. There is no universally ideal choice of grouping pattern.",
        "Because career ladders are primarily within functions, there is a tendency for the number of levels of management in each function to expand over time.",
      ],
    },
    "§2 Linking": {
      heading: "Linking: Coordination mechanisms",
      paragraphs: [
        "It is now commonplace for employees scattered across the world to spend significant amounts of their day collaborating with one another using video conferencing technologies. In some organizations, managers are using social media technologies to engage the entire organization in collective conversations.",
        "Organizations sometimes create or use special roles to help coordinate work. Liaisons serve as conduits for information and expertise, and as contacts and advisors on the work involving their groups.",
        "Organizations can also use special groups such as X-teams and task forces to ensure that different parts of an organization are linked.",
      ],
    },
    "§3 Aligning": {
      heading: "Aligning: Control mechanisms",
      paragraphs: [
        "Variable pay should reward performance that is well-aligned with the firm's strategy, easy to measure, clear to the employee, controllable by the employee, and guided by the principle of equity.",
        "When performance measures are incomplete, they drive behavior that is not perfectly aligned with organizational goals.",
        "Scholars have highlighted seven key work design factors that facilitate employee engagement: setting clear goals, providing autonomy, providing resources, providing low to moderate time pressure, getting employees the right sort of help, providing a climate of psychological safety, and listening to employees.",
      ],
    },
    "§4 Redesign": {
      heading: "Deliberately changing an organization's structure",
      paragraphs: [
        "The most frequent stimulus to organizational design change is that the current design no longer fits the pressures from the external business environment.",
        "One key cost associated with organizational redesign is stress and anxiety for employees. Frequent waves of restructuring can lead to enormous anxiety, a loss of continuity, and the departure of key people.",
        "A related key cost of organizational redesign is the disruption of informal systems and processes.",
      ],
    },
    "§5 Less-hierarchical": {
      heading: "Less-hierarchical organizations",
      paragraphs: [
        "Zappos is a well-known example of a company that adopted holacracy. The social media company Medium had been using holacracy, but dropped it, with a senior manager noting it was difficult to coordinate efforts at scale.",
        "Some research suggests that pressure from peers can actually be more stressful for employees than that from bosses.",
        "Exit interviews of a subset of Zappos employees indicated that ambiguity and lack of clarity around progression, compensation and responsibilities led them to leave.",
      ],
    },
    "§6 Crowd-centric": {
      heading: "Crowd-centric ways of organizing",
      paragraphs: [
        "Employers fund the platform, govern its usage, and take a fee from each transaction. Yet they define themselves as neutral intermediaries not employers and thus bypass employment regulations.",
        "Flash organizations are crowds structured like organizations to achieve complex and open-ended goals.",
        "Microwork platforms like Amazon Mechanical Turk and Crowdflower focus on relatively simple, repetitive tasks.",
      ],
    },
  },
  cultural: {
    "Meaning & Symbols": {
      heading: "Meaning and symbols",
      paragraphs: [
        "Culture provides a template on which meanings are read and actions are based. It is attached to both the material and immaterial, to words and deeds, and it shapes and reflects social and material conditions.",
        "Symbols are vehicles for meaning. Decoding what a given symbol or set of symbols means to a specific group of people is what cultural analysis is all about.",
        "Within a single organization, the same symbol can have different meanings for different groups.",
      ],
    },
    "Habits & History": {
      heading: "Habits and history",
      paragraphs: [
        "Culture emerges slowly and unevenly. It is dependent on what has worked in the past to sustain group endeavors and is consequently built on traditions and the experience of success.",
        "Even when regulation prohibited trainees working 120-hour weeks, many interns continued to work the long hours willingly — because they embraced the surgical iron man identity.",
      ],
    },
    Identity: {
      heading: "Identity",
      paragraphs: [
        "Work is a key source of identity for people, and scholars have shown how the workplace is an identity workspace for many workers.",
        "Because work can be a key area through which individuals derive their identities, changes in work that may seem minor for outsiders can deeply affect the identities of those performing the work.",
      ],
    },
    Subcultures: {
      heading: "Subcultures",
      paragraphs: [
        "Subcultures are present in every organization — groups of people who share common identities based on characteristics that often transcend their organizationally prescribed roles.",
        "Engineers and marketers within the same company often have distinctive subcultures, which emerge from their occupational interests and educational backgrounds.",
      ],
    },
    "Cross-Cultural Dynamics": {
      heading: "Cross-cultural dynamics",
      paragraphs: [
        "In today's global economy, it is common for organization members to interact frequently with colleagues from different cultures. Subcultures often form in different locations.",
        "Research suggests that having team members be able to meet in person and building a shared team identity can help members work together across locations.",
      ],
    },
    "Culture, Control & Motivation": {
      heading: "Culture, control, and motivation",
      paragraphs: [
        "Managers often attempt to increase worker motivation by providing socialization and symbols that reinforce the values they hope that employees will internalize.",
        "Maintaining observability of workers may counterintuitively reduce their performance — creating a transparency paradox. (Bernstein 2012)",
        "The attempt to loosen bureaucratic control ended up tightening what Weber called the iron cage, through a system of peer-based control. (Barker 1993)",
      ],
    },
    "Future of Culture": {
      heading: "The future of organizational culture",
      paragraphs: [
        "A host of changes, many technological, have given rise to a gig economy, a market system in which individuals and organizations contract with independent workers for short-term engagements.",
        "Workers on these platforms may experience algorithmic cruelty: hypervigilance despite claims of flexibility, isolation despite claims of autonomy. (Gray & Suri 2019)",
      ],
    },
  },
  political: {
    "Positional Power": {
      heading: "Positional power",
      paragraphs: [
        "Positional power is the power stemming from formal hierarchical position. From the political perspective, the organization chart is more than a design that specifies reporting responsibilities — it also provides a good guide to the vertical power system of the organization.",
        "Excessive reliance on control processes can undermine positional power. When a boss encounters resistance from subordinates, heavy reliance on sanctions can transform authority into coercion, which is rarely accepted as legitimate.",
      ],
    },
    "Personal Power": {
      heading: "Personal power",
      paragraphs: [
        "Personal power is power derived from an individual's unique personal attributes and skills such as expertise, track record, and social skills.",
        "Expertise — the mastery of a skill or body of knowledge that is both valued by the organization and relatively scarce — can be a significant source of power.",
        "Today, we see a similar phenomenon occurring with individuals or subunits involved in data analytics.",
      ],
    },
    "Network Power": {
      heading: "Network power",
      paragraphs: [
        "Network power is power derived from an individual's relationships with others and knowledge of the social landscape. Both company gossip and social research have long recognized that know-who is as important as know-how in any organization.",
        "As organizations become increasingly flat and distributed, the kind of influence that comes from social networks is often much more significant than the authority that derives from formal hierarchical position.",
        "Acting as the informal bridge or broker connecting individuals or units across structural holes in a network is a significant source of power.",
      ],
    },
    "Interests & Stakeholders": {
      heading: "Interests and stakeholders",
      paragraphs: [
        "The political perspective broadens the scope of interests beyond what can be calculated in economic terms to include a variety of interests such as autonomy and status that are difficult to reduce to economic terms.",
        "Interests are both complex and dynamic: that is, they change in content and in relative importance over time and as context changes.",
      ],
    },
    "Building a Network": {
      heading: "Building a network",
      paragraphs: [
        "An effective network extends in three directions: upward to those in higher positions of formal authority, horizontally to those in adjacent units, and downward to those engaged in tasks that have important consequences for your own work.",
        "It is important to build ties before you need them, to make networking a way of life.",
      ],
    },
    "Using Power & Influence": {
      heading: "Using power and influence",
      paragraphs: [
        "Those who are effective in organizations engage in stakeholder mapping, understand sources of resistance for each key stakeholder group, and tailor individual and collective influence tactics to particular stakeholders.",
        "Stakeholder mapping is a key tactic for helping you identify the interests of those who will be affected by your planned change.",
      ],
    },
    "Future of Organizational Power": {
      heading: "The future of organizational power",
      paragraphs: [
        "Social media are having a transformative effect on society. As social media bring unprecedented levels of voice, information, and ability to connect to everyday people, they are changing relationships between organizational actors and outside stakeholders.",
        "New power is more like a current: made by many, participatory and peer-driven. The goal is not to hoard it but to channel it. (Timms & Heimans 2018)",
        "It is unclear whether the introduction of new technologies will facilitate a high degree of organizational or societal change.",
      ],
    },
  },
};

const SECTIONS_ORDER_BY_LENS = {
  structural: [
    "§1 Grouping",
    "§2 Linking",
    "§3 Aligning",
    "§4 Redesign",
    "§5 Less-hierarchical",
    "§6 Crowd-centric",
  ],
  cultural: [
    "Meaning & Symbols",
    "Habits & History",
    "Identity",
    "Subcultures",
    "Cross-Cultural Dynamics",
    "Culture, Control & Motivation",
    "Future of Culture",
  ],
  political: [
    "Positional Power",
    "Personal Power",
    "Network Power",
    "Interests & Stakeholders",
    "Building a Network",
    "Using Power & Influence",
    "Future of Organizational Power",
  ],
};

const SEC_BG = {
  "§1 Grouping": "#E6F1FB",
  "§2 Linking": "#E1F5EE",
  "§3 Aligning": "#FAEEDA",
  "§4 Redesign": "#FAECE7",
  "§5 Less-hierarchical": "#EEEDFE",
  "§6 Crowd-centric": "#F1EFE8",
  "Meaning & Symbols": "#E6F1FB",
  "Habits & History": "#FAEEDA",
  Identity: "#E1F5EE",
  Subcultures: "#EEEDFE",
  "Cross-Cultural Dynamics": "#FAECE7",
  "Culture, Control & Motivation": "#F1EFE8",
  "Future of Culture": "#EEEDFE",
  "Positional Power": "#FAECE7",
  "Personal Power": "#E6F1FB",
  "Network Power": "#E1F5EE",
  "Interests & Stakeholders": "#FAEEDA",
  "Building a Network": "#EEEDFE",
  "Using Power & Influence": "#FAECE7",
  "Future of Organizational Power": "#F1EFE8",
};
const SEC_TX = {
  "§1 Grouping": "#0C447C",
  "§2 Linking": "#085041",
  "§3 Aligning": "#633806",
  "§4 Redesign": "#712B13",
  "§5 Less-hierarchical": "#3C3489",
  "§6 Crowd-centric": "#444441",
  "Meaning & Symbols": "#0C447C",
  "Habits & History": "#633806",
  Identity: "#085041",
  Subcultures: "#3C3489",
  "Cross-Cultural Dynamics": "#712B13",
  "Culture, Control & Motivation": "#444441",
  "Future of Culture": "#3C3489",
  "Positional Power": "#712B13",
  "Personal Power": "#0C447C",
  "Network Power": "#085041",
  "Interests & Stakeholders": "#633806",
  "Building a Network": "#3C3489",
  "Using Power & Influence": "#712B13",
  "Future of Organizational Power": "#444441",
};
const TYPE_BG = {
  "New citation": "#E6F1FB",
  "Updated claim": "#FAECE7",
  "New example": "#E1F5EE",
  "Outdated flag": "#FCEBEB",
};
const TYPE_TX = {
  "New citation": "#0C447C",
  "Updated claim": "#712B13",
  "New example": "#085041",
  "Outdated flag": "#791F1F",
};
const TYPE_BORDER = {
  "New citation": "#1D9E75",
  "Updated claim": "#D85A30",
  "New example": "#1D9E75",
  "Outdated flag": "#E24B4A",
};

function normTitle(t) {
  return (t || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 60);
}
function extractJSON(text, type = "array") {
  const c = text.split("```json").join("").split("```").join("").trim();
  const [os, oe, as, ae] = [
    c.indexOf("{"),
    c.lastIndexOf("}"),
    c.indexOf("["),
    c.lastIndexOf("]"),
  ];
  if (type === "object") {
    if (os === -1 || oe === -1) return null;
    try {
      return JSON.parse(c.slice(os, oe + 1));
    } catch (e) {
      return null;
    }
  }
  if (as === -1 || ae === -1) return null;
  try {
    return JSON.parse(c.slice(as, ae + 1));
  } catch (e) {
    return null;
  }
}
function escX(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function xPara(t, s = "Normal") {
  return `<w:p><w:pPr><w:pStyle w:val="${s}"/></w:pPr><w:r><w:t xml:space="preserve">${escX(
    t
  )}</w:t></w:r></w:p>`;
}
function xIns(t, id, fnId, date) {
  const fn = fnId
    ? `<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="${fnId}"/></w:r>`
    : "";
  return `<w:p><w:ins w:id="${id}" w:author="OP Literature Assistant" w:date="${date}"><w:r><w:t xml:space="preserve">${escX(
    t
  )}</w:t></w:r>${fn}</w:ins></w:p>`;
}

const CT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/></Types>`;
const PKG_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/></Relationships>`;
const SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:trackChanges/></w:settings>`;
const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="52"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:pPr><w:spacing w:after="320"/></w:pPr><w:rPr><w:color w:val="595959"/><w:sz w:val="26"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="480" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="FootnoteText"><w:name w:val="footnote text"/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style><w:style w:type="character" w:styleId="FootnoteReference"><w:name w:val="footnote reference"/><w:rPr><w:vertAlign w:val="superscript"/></w:rPr></w:style></w:styles>`;

function buildDocXml(
  annotated,
  sectionsOrder,
  readingSections,
  lensLabel,
  uploadedDoc
) {
  const date = new Date().toISOString().replace(/\.\d{3}/, "");
  const bySection = {};
  sectionsOrder.forEach((s) => {
    bySection[s] = [];
  });
  annotated.forEach((p, i) => {
    if (bySection[p.section]) bySection[p.section].push({ ...p, fnId: i + 1 });
  });
  let id = 1,
    body = "";
  body += xPara(`A ${lensLabel} Perspective on Organizations`, "Title");
  body += xPara(
    "Proposed updates — " + new Date().toLocaleDateString(),
    "Subtitle"
  );
  if (uploadedDoc && uploadedDoc.sections && uploadedDoc.sections.length > 0) {
    for (const sec of uploadedDoc.sections) {
      body += xPara(sec.heading, "Heading1");
      sec.paragraphs.forEach((t) => {
        body += xPara(t, "Normal");
      });
      const matchedKey = fuzzyMatchSection(sec.heading, sectionsOrder);
      if (matchedKey && bySection[matchedKey]) {
        bySection[matchedKey].forEach((p) => {
          body += xIns(p.annotation?.annotation || "", id++, p.fnId, date);
        });
        bySection[matchedKey] = [];
      }
    }
    for (const sec of sectionsOrder) {
      if (bySection[sec] && bySection[sec].length > 0) {
        body += xPara(`Additional updates for ${sec}`, "Heading1");
        bySection[sec].forEach((p) => {
          body += xIns(p.annotation?.annotation || "", id++, p.fnId, date);
        });
      }
    }
  } else {
    for (const sec of sectionsOrder) {
      const sd = readingSections[sec];
      if (!sd) continue;
      body += xPara(sd.heading, "Heading1");
      sd.paragraphs.forEach((t) => {
        body += xPara(t, "Normal");
      });
      (bySection[sec] || []).forEach((p) => {
        body += xIns(p.annotation?.annotation || "", id++, p.fnId, date);
      });
    }
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr/></w:body></w:document>`;
}

function buildFootnotesXml(annotated) {
  let fns = `<w:footnote w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:footnote><w:footnote w:type="continuationSeparator" w:id="0"><w:p><w:r><w:continuationSeparator/></w:r></w:p></w:footnote>`;
  annotated.forEach((p, i) => {
    const fn =
      p.annotation?.footnote ||
      `${p.authors}. "${p.title}." ${p.venue} (${p.year}).`;
    fns += `<w:footnote w:id="${
      i + 1
    }"><w:p><w:pPr><w:pStyle w:val="FootnoteText"/></w:pPr><w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteRef/></w:r><w:r><w:t xml:space="preserve"> ${escX(
      fn
    )}</w:t></w:r></w:p></w:footnote>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${fns}</w:footnotes>`;
}

async function generateDocx(
  annotated,
  sectionsOrder,
  readingSections,
  lensLabel,
  uploadedDoc
) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CT_XML);
  zip.file("_rels/.rels", PKG_RELS);
  zip.file(
    "word/document.xml",
    buildDocXml(
      annotated,
      sectionsOrder,
      readingSections,
      lensLabel,
      uploadedDoc
    )
  );
  zip.file("word/_rels/document.xml.rels", DOC_RELS);
  zip.file("word/styles.xml", STYLES_XML);
  zip.file("word/settings.xml", SETTINGS_XML);
  zip.file("word/footnotes.xml", buildFootnotesXml(annotated));
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${lensLabel.toLowerCase().replace(/ /g, "_")}_updates.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Claude API call with retry on 429 ───────────────────────────
async function claudeCall(prompt, apiKey) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  };
  const delays = [5000, 15000, 30000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
    if (res.status === 429 && attempt < delays.length) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
      continue;
    }
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const d = await res.json();
    if (d.error) throw new Error(d.error.message);
    return (d.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
  }
}

// ── Semantic Scholar — journal filter applied for non-AI keywords ─
async function searchSemanticScholar(
  kw,
  section,
  fromYear,
  currentYear,
  ssApiKey = ""
) {
  const aiRelated = isAiKeyword(kw);
  const yearRange = `${fromYear}-${currentYear}`;
  const keyParam = ssApiKey ? `&apiKey=${encodeURIComponent(ssApiKey)}` : "";
  const url = `/api/semantic-scholar?query=${encodeURIComponent(
    kw
  )}&year=${yearRange}${keyParam}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Semantic Scholar ${res.status}`);
  const data = await res.json();
  const results = (data.data || [])
    .filter((p) => p.title && p.year >= fromYear && p.year <= currentYear)
    .filter((p) => !isExcludedJournal(p.venue))
    .filter((p) =>
      aiRelated ? isRelevantAiPaper(p) : matchesTargetJournal(p.venue)
    )
    .map((p, i) => {
      const authors = (p.authors || [])
        .slice(0, 3)
        .map((a) => {
          const pts = (a.name || "").split(" ");
          return pts[pts.length - 1];
        })
        .join(", ");
      const doi = p.externalIds?.DOI;
      const paperUrl =
        p.openAccessPdf?.url || (doi ? `https://doi.org/${doi}` : null);
      const abstract = String(p.abstract || "");
      return {
        id: `ss-${normTitle(p.title)}-${i}-${Date.now()}`,
        title: String(p.title),
        authors,
        year: Number(p.year),
        venue: String(p.venue || ""),
        abstract,
        url: paperUrl,
        isOpenAccess: Boolean(p.isOpenAccess),
        isPreprint:
          String(p.venue || "")
            .toLowerCase()
            .includes("arxiv") ||
          String(p.venue || "")
            .toLowerCase()
            .includes("ssrn"),
        keyword: kw,
        section,
        isAiRelated: aiRelated,
        annotation: null,
        dismissed: false,
        needsPDF: abstract.length < 20,
        hasPdf: false,
        source: "semanticscholar",
      };
    })
    .filter((p) => p.title.length > 5);
  if (aiRelated) results.sort((a, b) => b.year - a.year);
  return results;
}
async function searchCrossRef(kw, section, fromYear, currentYear) {
  const url = `/api/crossref?query=${encodeURIComponent(
    kw
  )}&fromYear=${fromYear}&toYear=${currentYear}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CrossRef ${res.status}`);
  const data = await res.json();
  return (data.message?.items || [])
    .filter((item) => {
      const venue = ((item["container-title"] || [])[0] || "").toLowerCase();
      return PRACTITIONER_JOURNALS.some((j) => venue.includes(j));
    })
    .filter((item) => item.title?.[0])
    .map((item, i) => {
      const authors = (item.author || [])
        .slice(0, 3)
        .map((a) => a.family || "")
        .filter(Boolean)
        .join(", ");
      const year = item.published?.["date-parts"]?.[0]?.[0] || 0;
      const venue = (item["container-title"] || [])[0] || "";
      const doi = item.DOI;
      const paperUrl = item.URL || (doi ? `https://doi.org/${doi}` : null);
      const abstract = item.abstract
        ? item.abstract.replace(/<[^>]*>/g, "").trim()
        : "";
      return {
        id: `cr-${normTitle(item.title[0])}-${i}-${Date.now()}`,
        title: String(item.title[0]),
        authors,
        year: Number(year),
        venue,
        abstract,
        url: paperUrl,
        isOpenAccess: false,
        isPreprint: false,
        keyword: kw,
        section,
        isAiRelated: isAiKeyword(kw),
        annotation: null,
        dismissed: false,
        needsPDF: !abstract || abstract.length < 20,
        hasPdf: false,
        source: "crossref",
        doi,
      };
    })
    .filter((p) => p.year >= fromYear && p.title.length > 5);
}

// ── Manual paper lookup by DOI ───────────────────────────────────
async function lookupPaperByDOI(input, defaultSection) {
  const doiMatch = input.trim().match(/10\.\d{4,}[^\s]*/);
  if (!doiMatch)
    throw new Error(
      "No valid DOI found. Paste a DOI (10.xxxx/...) or a doi.org URL."
    );
  const doi = doiMatch[0].replace(/[.,;]+$/, "");
  const res = await fetch(
    `/api/crossref-lookup?doi=${encodeURIComponent(doi)}`
  );
  if (!res.ok) throw new Error(`Paper not found for DOI: ${doi}`);
  const data = await res.json();
  const item = data.message;
  const authors = (item.author || [])
    .slice(0, 3)
    .map((a) => a.family || "")
    .filter(Boolean)
    .join(", ");
  const year =
    item.published?.["date-parts"]?.[0]?.[0] || new Date().getFullYear();
  const venue = (item["container-title"] || [])[0] || "";
  const paperUrl = item.URL || `https://doi.org/${doi}`;
  const abstract = item.abstract
    ? item.abstract.replace(/<[^>]*>/g, "").trim()
    : "";
  return {
    id: `manual-${normTitle(item.title?.[0] || doi)}-${Date.now()}`,
    title: String(item.title?.[0] || doi),
    authors,
    year: Number(year),
    venue,
    abstract,
    url: paperUrl,
    isOpenAccess: false,
    isPreprint: false,
    keyword: "manual entry",
    section: defaultSection,
    isAiRelated: false,
    annotation: null,
    dismissed: false,
    needsPDF: !abstract || abstract.length < 20,
    hasPdf: false,
    source: "manual",
    doi,
  };
}

// ── OpenAlex — third source, good OB/management coverage ────────
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return "";
  const words = {};
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) words[pos] = word;
  }
  const maxPos = Math.max(...Object.keys(words).map(Number));
  return Array.from({ length: maxPos + 1 }, (_, i) => words[i] || "")
    .join(" ")
    .trim();
}

async function searchOpenAlex(kw, section, fromYear, currentYear) {
  const aiRelated = isAiKeyword(kw);
  const url = `/api/openalex?query=${encodeURIComponent(
    kw
  )}&fromYear=${fromYear}&toYear=${currentYear}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const data = await res.json();
  const results = (data.results || [])
    .filter(
      (p) =>
        p.title &&
        p.publication_year >= fromYear &&
        p.publication_year <= currentYear
    )
    .map((p, i) => {
      const authors = (p.authorships || [])
        .slice(0, 3)
        .map((a) => {
          const name = a.author?.display_name || "";
          const parts = name.split(" ");
          return parts[parts.length - 1];
        })
        .join(", ");
      const venue = p.primary_location?.source?.display_name || "";
      const doi = p.doi ? p.doi.replace("https://doi.org/", "") : null;
      const paperUrl =
        p.open_access?.oa_url || (doi ? `https://doi.org/${doi}` : null);
      const abstract = reconstructAbstract(p.abstract_inverted_index);
      return {
        id: `oa-${normTitle(p.title)}-${i}-${Date.now()}`,
        title: String(p.title),
        authors,
        year: Number(p.publication_year),
        venue,
        abstract,
        url: paperUrl,
        isOpenAccess: Boolean(p.open_access?.is_oa),
        isPreprint: false,
        keyword: kw,
        section,
        isAiRelated: aiRelated,
        annotation: null,
        dismissed: false,
        needsPDF: abstract.length < 20,
        hasPdf: false,
        source: "openalex",
      };
    })
    .filter((p) => p.title.length > 5)
    .filter((p) => !isExcludedJournal(p.venue))
    .filter((p) =>
      aiRelated ? isRelevantAiPaper(p) : matchesTargetJournal(p.venue)
    );

  // Recency boost for AI keywords — newest papers first
  if (aiRelated) results.sort((a, b) => b.year - a.year);
  return results;
}

// ── Annotate paper ───────────────────────────────────────────────
async function annotatePaper(
  paper,
  apiKey,
  dynamicClaims = null,
  pdfText = null
) {
  const claimsSource = dynamicClaims || SECTION_CLAIMS[paper.section] || [];
  const claims = claimsSource.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const claimsNote = dynamicClaims
    ? "(extracted from the current version of the uploaded reading)"
    : "(from the 2019 version of the reading)";
  const sourceText = pdfText
    ? `Full article text (first 10,000 characters):\n${pdfText}`
    : paper.abstract && paper.abstract.length > 20
    ? `Abstract: ${paper.abstract}`
    : "Abstract: Not available — annotation based on title, venue, and year only.";
  const prompt = `You are a research assistant updating an MIT Sloan MBA reading on organizational behavior.\n\nPaper assigned to "${paper.section}":\nTitle: ${paper.title}\nAuthors: ${paper.authors}\nYear: ${paper.year}\nVenue: ${paper.venue}\n${sourceText}\n\nClaims in "${paper.section}" that could be updated ${claimsNote}:\n${claims}\n\nTasks:\n1. Pick the single claim this paper most directly updates\n2. Choose: "New citation", "Updated claim", "New example", or "Outdated flag"\n3. Write a 2-4 sentence draft annotation\n4. Write a Chicago-style footnote\n\nReturn ONLY a JSON object with keys: claim, type, annotation, footnote. No markdown.`;
  const text = await claudeCall(prompt, apiKey);
  const p = extractJSON(text, "object");
  if (!p) throw new Error("Could not parse annotation");
  return {
    claim: String(p.claim || ""),
    type: String(p.type || "New citation"),
    annotation: String(p.annotation || ""),
    footnote: String(p.footnote || ""),
  };
}

const defaultFromDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return d.toISOString().split("T")[0];
};

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [ssApiKey, setSsApiKey] = useState("");
  const [showApiInput, setShowApiInput] = useState(false);
  const [activeLens, setActiveLens] = useState("structural");
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [annotatingAll, setAnnotatingAll] = useState(false);
  const [scanProgress, setScanProgress] = useState({
    done: 0,
    total: 0,
    current: "",
    errors: [],
  });
  const [annoProgress, setAnnoProgress] = useState({ done: 0, total: 0 });
  const [lastScan, setLastScan] = useState(null);
  const [lastScanISO, setLastScanISO] = useState(null);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [view, setView] = useState("queue");
  const [selectedIds, setSelectedIds] = useState([]);
  const [yearFilter, setYearFilter] = useState("All");
  const [aiOnly, setAiOnly] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [activeComment, setActiveComment] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState({});
  const [exporting, setExporting] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploading, setUploading] = useState(false);
  const [paperPdfs, setPaperPdfs] = useState({});
  const [uploadingPdfForPaper, setUploadingPdfForPaper] = useState(null);
  const [showAddPaper, setShowAddPaper] = useState(false);
  const [addPaperInput, setAddPaperInput] = useState("");
  const [addingPaper, setAddingPaper] = useState(false);
  const [addPaperError, setAddPaperError] = useState("");

  const fileInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);

  const KEYWORDS = LENS_KEYWORDS[activeLens];
  const SECTIONS_ORDER = SECTIONS_ORDER_BY_LENS[activeLens];
  const READING_SECTIONS = READING_SECTIONS_BY_LENS[activeLens];
  const uploadedDoc = uploadedDocs[activeLens] || null;

  useEffect(() => {
    const k = lsGet("op_apikey");
    if (k) setApiKey(k);
    const sk = lsGet("op_ss_apikey");
    if (sk) setSsApiKey(sk);
    const lens = lsGet("op_activelens");
    if (lens) setActiveLens(lens);
    const fd = lsGet("op_fromdate");
    if (fd) setFromDate(fd);
    const d = lsGet("op_lastscan");
    if (d) setLastScan(d);
    const iso = lsGet("op_lastscaniso");
    if (iso) setLastScanISO(iso);
    const docs = {};
    for (const l of Object.keys(LENS_LABELS)) {
      const stored = lsGet(`op_uploaded_${l}`);
      if (stored) {
        try {
          docs[l] = JSON.parse(stored);
        } catch (e) {}
      }
    }
    setUploadedDocs(docs);
  }, []);

  useEffect(() => {
    const r = lsGet(`op_results_${activeLens}`);
    setResults(r ? JSON.parse(r) : []);
    setSelectedIds([]);
    setView("queue");
  }, [activeLens]);

  const persist = useCallback(
    (data) => {
      lsSet(`op_results_${activeLens}`, JSON.stringify(data));
    },
    [activeLens]
  );

  const moveAnnotation = useCallback(
    (id, section) => {
      setResults((prev) => {
        const u = prev.map((p) => (p.id === id ? { ...p, section } : p));
        persist(u);
        return u;
      });
    },
    [persist]
  );
  const dismissPaper = useCallback(
    (id) => {
      setResults((prev) => {
        const u = prev.map((p) =>
          p.id === id ? { ...p, dismissed: true } : p
        );
        persist(u);
        return u;
      });
    },
    [persist]
  );
  const restorePaper = useCallback(
    (id) => {
      setResults((prev) => {
        const u = prev.map((p) =>
          p.id === id ? { ...p, dismissed: false } : p
        );
        persist(u);
        return u;
      });
    },
    [persist]
  );
  const removeFromDoc = useCallback(
    (id) => {
      setResults((prev) => {
        const u = prev.map((p) =>
          p.id === id ? { ...p, annotation: null, dismissed: false } : p
        );
        persist(u);
        return u;
      });
    },
    [persist]
  );

  const reannotatePaper = useCallback(
    async (id) => {
      if (!apiKey) {
        setShowApiInput(true);
        return;
      }
      const paper = results.find((p) => p.id === id);
      if (!paper) return;
      setResults((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, annotating: true, annotation: null } : p
        )
      );
      try {
        const dynamicClaims = uploadedDoc
          ? extractClaimsFromDoc(uploadedDoc, paper.section, SECTIONS_ORDER)
          : null;
        const pdfText = paperPdfs[id] || null;
        const anno = await annotatePaper(paper, apiKey, dynamicClaims, pdfText);
        setResults((prev) => {
          const u = prev.map((p) =>
            p.id === id ? { ...p, annotation: anno, annotating: false } : p
          );
          persist(u);
          return u;
        });
      } catch (e) {
        setResults((prev) => {
          const u = prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  annotating: false,
                  annotation: {
                    claim: "Error",
                    type: "Error",
                    annotation: `Error: ${e.message}`,
                    footnote: "",
                  },
                }
              : p
          );
          persist(u);
          return u;
        });
      }
    },
    [apiKey, results, persist, uploadedDoc, SECTIONS_ORDER, paperPdfs]
  );

  const clearResults = useCallback(() => {
    if (
      !window.confirm("Clear all scan results and annotations for this lens?")
    )
      return;
    setResults([]);
    setSelectedIds([]);
    setView("queue");
    setPaperPdfs({});
    lsSet(`op_results_${activeLens}`, "");
  }, [activeLens]);

  const saveCommentEdit = useCallback(
    (id) => {
      setResults((prev) => {
        const u = prev.map((p) =>
          p.id === id
            ? {
                ...p,
                annotation: {
                  ...p.annotation,
                  annotation: editCommentText[id],
                },
              }
            : p
        );
        persist(u);
        return u;
      });
      setEditingComment(null);
    },
    [editCommentText, persist]
  );

  const handleUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.name.endsWith(".docx")) {
        alert("Please upload a .docx file.");
        return;
      }
      setUploading(true);
      try {
        const sections = await parseDocxFile(file);
        const doc = {
          filename: file.name,
          lens: activeLens,
          sections,
          uploadedAt: new Date().toLocaleString(),
        };
        const newDocs = { ...uploadedDocs, [activeLens]: doc };
        setUploadedDocs(newDocs);
        lsSet(`op_uploaded_${activeLens}`, JSON.stringify(doc));
      } catch (err) {
        alert("Could not read document: " + err.message);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [activeLens, uploadedDocs]
  );

  const removeUpload = useCallback(() => {
    const newDocs = { ...uploadedDocs };
    delete newDocs[activeLens];
    setUploadedDocs(newDocs);
    lsSet(`op_uploaded_${activeLens}`, "");
  }, [activeLens, uploadedDocs]);

  const handlePaperPdfUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file || !uploadingPdfForPaper) return;
      try {
        const text = await extractPdfText(file);
        setPaperPdfs((prev) => ({ ...prev, [uploadingPdfForPaper]: text }));
        setResults((prev) => {
          const u = prev.map((p) =>
            p.id === uploadingPdfForPaper
              ? { ...p, needsPDF: false, hasPdf: true }
              : p
          );
          persist(u);
          return u;
        });
      } catch (err) {
        alert("Could not read PDF: " + err.message);
      } finally {
        setUploadingPdfForPaper(null);
        if (pdfFileInputRef.current) pdfFileInputRef.current.value = "";
      }
    },
    [uploadingPdfForPaper, persist]
  );

  const handleManualAdd = useCallback(async () => {
    if (!addPaperInput.trim()) return;
    setAddingPaper(true);
    setAddPaperError("");
    try {
      const paper = await lookupPaperByDOI(addPaperInput, SECTIONS_ORDER[0]);
      const exists = results.some(
        (r) => normTitle(r.title) === normTitle(paper.title)
      );
      if (exists) {
        setAddPaperError("This paper is already in the queue.");
        return;
      }
      const updated = [...results, paper];
      setResults(updated);
      persist(updated);
      setAddPaperInput("");
      setShowAddPaper(false);
    } catch (err) {
      setAddPaperError(err.message);
    } finally {
      setAddingPaper(false);
    }
  }, [addPaperInput, results, persist, SECTIONS_ORDER]);

  const fromYear = parseInt((fromDate || "2022").split("-")[0]);
  const currentYear = new Date().getFullYear();
  const searchYears = Array.from(
    { length: currentYear - fromYear + 1 },
    (_, i) => fromYear + i
  );
  const searchPromptStr =
    searchYears.length === 1
      ? `published in ${fromYear}`
      : `published between ${fromYear} and ${currentYear}`;

  const runScan = useCallback(async () => {
    setScanning(true);
    setResults([]);
    setSelectedIds([]);
    setPaperPdfs({});
    setScanProgress({
      done: 0,
      total: KEYWORDS.length,
      current: "Starting...",
      errors: [],
    });
    let all = [],
      errs = [];
    for (let i = 0; i < KEYWORDS.length; i++) {
      const kw = KEYWORDS[i];
      setScanProgress({
        done: i,
        total: KEYWORDS.length,
        current: `Searching: "${kw.kw}"`,
        errors: errs,
      });
      const [ssResults, crResults, oaResults] = await Promise.all([
        searchSemanticScholar(
          kw.kw,
          kw.section,
          fromYear,
          currentYear,
          ssApiKey
        ).catch((e) => {
          errs = [...errs, { kw: kw.kw, err: e.message }];
          return [];
        }),
        kw.crossRefFlag
          ? searchCrossRef(kw.kw, kw.section, fromYear, currentYear).catch(
              () => []
            )
          : Promise.resolve([]),
        searchOpenAlex(kw.kw, kw.section, fromYear, currentYear).catch(
          () => []
        ),
      ]);
      all = [...all, ...ssResults, ...crResults, ...oaResults];
      await new Promise((r) => setTimeout(r, 1000)); // 1s delay — safe with authenticated SS key
    }
    const seen = new Set(),
      deduped = [];
    for (const p of all) {
      const k = normTitle(p.title);
      if (!seen.has(k) && p.title.length > 5) {
        seen.add(k);
        deduped.push(p);
      }
    }
    const date = new Date().toLocaleString(),
      iso = new Date().toISOString().split("T")[0];
    setResults(deduped);
    setLastScan(date);
    setLastScanISO(iso);
    setScanning(false);
    setYearFilter("All");
    setAiOnly(false);
    setShowDismissed(false);
    setScanProgress((p) => ({
      ...p,
      done: KEYWORDS.length,
      current: `Done — ${deduped.length} papers found`,
    }));
    persist(deduped);
    lsSet("op_lastscan", date);
    lsSet("op_lastscaniso", iso);
    lsSet("op_fromdate", fromDate);
    lsSet("op_activelens", activeLens);
  }, [fromDate, KEYWORDS, fromYear, currentYear, persist, activeLens]);

  const runAnnotations = useCallback(async () => {
    if (!apiKey) {
      setShowApiInput(true);
      return;
    }
    const toAnno = results.filter(
      (p) => selectedIds.includes(p.id) && !p.annotation && !p.dismissed
    );
    if (!toAnno.length) return;
    setAnnotatingAll(true);
    setAnnoProgress({ done: 0, total: toAnno.length });
    let updated = [...results];
    for (let i = 0; i < toAnno.length; i++) {
      setAnnoProgress({ done: i, total: toAnno.length });
      const paper = toAnno[i];
      const idx = updated.findIndex((p) => p.id === paper.id);
      updated[idx] = { ...updated[idx], annotating: true };
      setResults([...updated]);
      try {
        const dynamicClaims = uploadedDoc
          ? extractClaimsFromDoc(uploadedDoc, paper.section, SECTIONS_ORDER)
          : null;
        const pdfText = paperPdfs[paper.id] || null;
        const anno = await annotatePaper(paper, apiKey, dynamicClaims, pdfText);
        updated[idx] = { ...updated[idx], annotation: anno, annotating: false };
      } catch (e) {
        updated[idx] = {
          ...updated[idx],
          annotating: false,
          annotation: {
            claim: "Error",
            type: "Error",
            annotation: `Error: ${e.message}`,
            footnote: "",
          },
        };
      }
      setResults([...updated]);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setAnnotatingAll(false);
    setAnnoProgress((p) => ({ ...p, done: toAnno.length }));
    setSelectedIds((prev) =>
      prev.filter((id) => !toAnno.some((p) => p.id === id))
    );
    persist(updated);
  }, [
    apiKey,
    results,
    selectedIds,
    persist,
    uploadedDoc,
    SECTIONS_ORDER,
    paperPdfs,
  ]);

  const handleExport = useCallback(async () => {
    const ann = results.filter(
      (p) => p.annotation && p.annotation.type !== "Error" && !p.dismissed
    );
    if (!ann.length) return;
    setExporting(true);
    try {
      await generateDocx(
        ann,
        SECTIONS_ORDER,
        READING_SECTIONS,
        LENS_LABELS[activeLens],
        uploadedDoc
      );
    } catch (e) {
      alert("Export failed: " + e.message);
    } finally {
      setExporting(false);
    }
  }, [results, SECTIONS_ORDER, READING_SECTIONS, activeLens, uploadedDoc]);

  const inDoc = results.filter(
    (p) => p.annotation && p.annotation.type !== "Error" && !p.dismissed
  );
  const queuePapers = showDismissed
    ? results.filter((p) => p.dismissed)
    : results.filter((p) => !p.annotation && !p.dismissed);
  const filtered = queuePapers.filter((p) => {
    if (yearFilter !== "All" && String(p.year) !== yearFilter) return false;
    if (aiOnly && !p.isAiRelated) return false;
    return true;
  });
  const unannotatedIds = queuePapers
    .filter((p) => !p.annotation)
    .map((p) => p.id);
  const allSelected =
    unannotatedIds.length > 0 &&
    unannotatedIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.some((id) => unannotatedIds.includes(id));
  const years = [
    "All",
    ...[...new Set(results.map((p) => p.year).filter(Boolean))]
      .sort((a, b) => b - a)
      .map(String),
  ];
  const pct = scanProgress.total
    ? Math.round((scanProgress.done / scanProgress.total) * 100)
    : 0;
  const annoPct = annoProgress.total
    ? Math.round((annoProgress.done / annoProgress.total) * 100)
    : 0;
  const selectedToAnnotate = selectedIds.filter((id) =>
    queuePapers.some((p) => p.id === id && !p.annotation)
  );
  const dismissedCount = results.filter((p) => p.dismissed).length;

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const handleSelectAll = () => {
    if (allSelected)
      setSelectedIds((prev) =>
        prev.filter((id) => !unannotatedIds.includes(id))
      );
    else setSelectedIds((prev) => [...new Set([...prev, ...unannotatedIds])]);
  };

  const Btn = ({ label, onClick, disabled, bg, color, border, small }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "5px 12px" : "7px 14px",
        fontSize: small ? 11 : 12,
        fontWeight: 500,
        borderRadius: 8,
        border: `0.5px solid ${border || "#D1D5DB"}`,
        background: bg || "#FFFFFF",
        color: disabled ? "#9CA3AF" : color || "#111827",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );

  const docSections =
    uploadedDoc && uploadedDoc.sections && uploadedDoc.sections.length > 0
      ? uploadedDoc.sections.map((s) => ({
          key: fuzzyMatchSection(s.heading, SECTIONS_ORDER) || s.heading,
          heading: s.heading,
          paragraphs: s.paragraphs,
        }))
      : SECTIONS_ORDER.map((k) => ({
          key: k,
          heading: READING_SECTIONS[k]?.heading || k,
          paragraphs: READING_SECTIONS[k]?.paragraphs || [],
        }));

  const sourceBadge = (source) => {
    if (source === "crossref")
      return { bg: "#FAEEDA", color: "#633806", label: "CrossRef" };
    if (source === "manual")
      return { bg: "#EEEDFE", color: "#3C3489", label: "Manual entry" };
    return null;
  };

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "1.5rem 1rem",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        color: "#111827",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            OP Literature Assistant
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6B7280" }}>
            {lastScan ? `Last scan: ${lastScan}` : "No scan run yet"}
            {results.length > 0
              ? ` · ${results.length} papers · ${inDoc.length} in document editor`
              : ""}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setShowApiInput(!showApiInput)}
            style={{
              fontSize: 12,
              padding: "5px 12px",
              borderRadius: 6,
              border: "0.5px solid #D1D5DB",
              background: apiKey ? "#E1F5EE" : "#FEF9E7",
              color: apiKey ? "#085041" : "#633806",
              cursor: "pointer",
            }}
          >
            {apiKey ? "API key set ✓" : "Set API key"}
          </button>
          <button
            onClick={() => setShowApiInput(!showApiInput)}
            style={{
              fontSize: 12,
              padding: "5px 12px",
              borderRadius: 6,
              border: "0.5px solid #D1D5DB",
              background: ssApiKey ? "#E1F5EE" : "#FEF9E7",
              color: ssApiKey ? "#085041" : "#633806",
              cursor: "pointer",
            }}
          >
            {ssApiKey ? "SS key set ✓" : "Set SS key"}
          </button>
          {results.length > 0 && !scanning && (
            <button
              onClick={clearResults}
              style={{
                fontSize: 12,
                padding: "5px 12px",
                borderRadius: 6,
                border: "0.5px solid #E5E7EB",
                background: "transparent",
                color: "#9CA3AF",
                cursor: "pointer",
              }}
            >
              Clear results
            </button>
          )}
          <Btn
            label={scanning ? "Scanning..." : "Run scan"}
            onClick={runScan}
            disabled={scanning || annotatingAll}
          />
        </div>
      </div>

      {/* API key input */}
      {showApiInput && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            background: "#F9FAFB",
            border: "0.5px solid #E5E7EB",
            borderRadius: 10,
          }}
        >
          <div style={{ marginBottom: "0.75rem" }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>
              Anthropic API key
            </p>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px" }}>
              Used for generating annotations. Get one at console.anthropic.com.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                style={{
                  flex: 1,
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "0.5px solid #D1D5DB",
                  background: "#FFFFFF",
                  color: "#111827",
                }}
              />
              <button
                onClick={() => {
                  lsSet("op_apikey", apiKey);
                  setShowApiInput(false);
                }}
                style={{
                  fontSize: 12,
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "0.5px solid #9FE1CB",
                  background: "#E1F5EE",
                  color: "#085041",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>
              Semantic Scholar API key
            </p>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px" }}>
              Used for scanning. Shared key — ask your administrator.{" "}
              <span style={{ color: "#633806" }}>
                Deactivates after 60 days of no use.
              </span>
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="password"
                value={ssApiKey}
                onChange={(e) => setSsApiKey(e.target.value)}
                placeholder="Paste SS API key..."
                style={{
                  flex: 1,
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "0.5px solid #D1D5DB",
                  background: "#FFFFFF",
                  color: "#111827",
                }}
              />
              <button
                onClick={() => {
                  lsSet("op_ss_apikey", ssApiKey);
                  setShowApiInput(false);
                }}
                style={{
                  fontSize: 12,
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "0.5px solid #9FE1CB",
                  background: "#E1F5EE",
                  color: "#085041",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lens selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>
          Lens:
        </span>
        {Object.entries(LENS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              if (!scanning && !annotatingAll) setActiveLens(key);
            }}
            disabled={scanning || annotatingAll}
            style={{
              fontSize: 13,
              padding: "6px 16px",
              borderRadius: 8,
              border: `0.5px solid ${
                activeLens === key ? "#111827" : "#E5E7EB"
              }`,
              background: activeLens === key ? "#111827" : "transparent",
              color: activeLens === key ? "#FFFFFF" : "#6B7280",
              cursor: scanning || annotatingAll ? "not-allowed" : "pointer",
              fontWeight: activeLens === key ? 500 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reading doc upload */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          background: "#F9FAFB",
          border: "0.5px solid #E5E7EB",
          borderRadius: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>
          {LENS_LABELS[activeLens]} reading:
        </span>
        {uploadedDoc ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>
              ✓ {uploadedDoc.filename}
            </span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>
              uploaded {uploadedDoc.uploadedAt}
            </span>
            <span style={{ fontSize: 11, color: "#059669" }}>
              · annotations will use this document's claims
            </span>
            <button
              onClick={removeUpload}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 4,
                border: "0.5px solid #E5E7EB",
                background: "transparent",
                color: "#9CA3AF",
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>
              No document uploaded — using sample text
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                fontSize: 12,
                padding: "5px 12px",
                borderRadius: 6,
                border: "0.5px solid #D1D5DB",
                background: "#FFFFFF",
                color: uploading ? "#9CA3AF" : "#111827",
                cursor: uploading ? "not-allowed" : "pointer",
                marginLeft: "auto",
              }}
            >
              {uploading ? "Parsing..." : "Upload .docx"}
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleUpload}
          style={{ display: "none" }}
        />
      </div>

      {/* Date picker */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: "0.75rem",
          padding: "0.75rem 1rem",
          background: "#F9FAFB",
          border: "0.5px solid #E5E7EB",
          borderRadius: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>
          Search papers from:
        </span>
        <input
          type="date"
          value={fromDate}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setFromDate(e.target.value)}
          disabled={scanning}
          style={{
            fontSize: 13,
            padding: "4px 8px",
            borderRadius: 6,
            border: "0.5px solid #D1D5DB",
            background: "#FFFFFF",
            color: "#111827",
          }}
        />
        {lastScanISO && (
          <button
            onClick={() => setFromDate(lastScanISO)}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 6,
              border: "0.5px solid #E5E7EB",
              background: "transparent",
              color: "#6B7280",
              cursor: "pointer",
            }}
          >
            Since last scan
          </button>
        )}
        <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>
          Searching {searchPromptStr}
        </span>
      </div>

      {/* Manual add paper */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => {
            setShowAddPaper(!showAddPaper);
            setAddPaperError("");
          }}
          style={{
            fontSize: 12,
            padding: "5px 12px",
            borderRadius: 6,
            border: "0.5px solid #E5E7EB",
            background: "transparent",
            color: "#6B7280",
            cursor: "pointer",
          }}
        >
          {showAddPaper ? "Cancel" : "+ Add paper by DOI"}
        </button>
        {showAddPaper && (
          <div
            style={{
              marginTop: 8,
              padding: "0.75rem 1rem",
              background: "#F9FAFB",
              border: "0.5px solid #E5E7EB",
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 8px" }}>
              Paste a DOI or doi.org URL — useful for HBR and Sloan articles you
              find directly.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={addPaperInput}
                onChange={(e) => {
                  setAddPaperInput(e.target.value);
                  setAddPaperError("");
                }}
                placeholder="e.g. 10.1086/701816 or https://doi.org/..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualAdd();
                }}
                style={{
                  flex: 1,
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "0.5px solid #D1D5DB",
                  background: "#FFFFFF",
                  color: "#111827",
                }}
              />
              <button
                onClick={handleManualAdd}
                disabled={addingPaper || !addPaperInput.trim()}
                style={{
                  fontSize: 12,
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "0.5px solid #D1D5DB",
                  background: "#FFFFFF",
                  color: addingPaper ? "#9CA3AF" : "#111827",
                  cursor: addingPaper ? "not-allowed" : "pointer",
                }}
              >
                {addingPaper ? "Looking up..." : "Add paper"}
              </button>
            </div>
            {addPaperError && (
              <p style={{ fontSize: 12, color: "#DC2626", margin: "6px 0 0" }}>
                {addPaperError}
              </p>
            )}
          </div>
        )}
      </div>

      <input
        ref={pdfFileInputRef}
        type="file"
        accept=".pdf"
        onChange={handlePaperPdfUpload}
        style={{ display: "none" }}
      />

      {/* Tabs */}
      {results.length > 0 && !scanning && (
        <div
          style={{
            display: "flex",
            borderBottom: "0.5px solid #E5E7EB",
            marginBottom: "1rem",
          }}
        >
          {[
            { id: "queue", label: `Review queue (${queuePapers.length})` },
            { id: "document", label: `Document editor (${inDoc.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: view === t.id ? 500 : 400,
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${
                  view === t.id ? "#111827" : "transparent"
                }`,
                color: view === t.id ? "#111827" : "#9CA3AF",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Scan progress */}
      {scanning && (
        <div
          style={{
            marginBottom: "1.5rem",
            background: "#FFFFFF",
            border: "0.5px solid #E5E7EB",
            borderRadius: 10,
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              fontSize: 13,
            }}
          >
            <span
              style={{
                color: "#6B7280",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {scanProgress.current}
            </span>
            <span style={{ color: "#6B7280" }}>{pct}%</span>
          </div>
          <div
            style={{
              height: 4,
              background: "#F3F4F6",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "#378ADD",
                borderRadius: 2,
                transition: "width 0.4s",
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: "8px 0 0" }}>
            {scanProgress.done} of {scanProgress.total} keyword searches
            complete · Semantic Scholar + CrossRef
          </p>
          {scanProgress.errors.length > 0 && (
            <p style={{ fontSize: 12, color: "#DC2626", margin: "4px 0 0" }}>
              {scanProgress.errors.length} error(s):{" "}
              {scanProgress.errors.map((e) => e.kw).join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Annotation progress */}
      {annotatingAll && (
        <div
          style={{
            marginBottom: "1.5rem",
            background: "#EEEDFE",
            border: "0.5px solid #CECBF6",
            borderRadius: 10,
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              fontSize: 13,
            }}
          >
            <span style={{ color: "#3C3489", fontWeight: 500 }}>
              Generating annotations
              {uploadedDoc ? " (using uploaded document)" : ""}
            </span>
            <span style={{ color: "#534AB7" }}>{annoPct}%</span>
          </div>
          <div
            style={{
              height: 4,
              background: "#CECBF6",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${annoPct}%`,
                background: "#7F77DD",
                borderRadius: 2,
                transition: "width 0.4s",
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: "#534AB7", margin: "8px 0 0" }}>
            {annoProgress.done} of {annoProgress.total} papers evaluated
          </p>
        </div>
      )}

      {/* ── QUEUE VIEW ── */}
      {(view === "queue" || !results.length) && (
        <>
          {results.length > 0 && !scanning && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  background: "#F9FAFB",
                  borderRadius: 8,
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    style={{
                      width: 16,
                      height: 16,
                      cursor: "pointer",
                      accentColor: "#378ADD",
                    }}
                  />
                  Select all
                </label>
                <span style={{ fontSize: 13, color: "#6B7280" }}>
                  {selectedToAnnotate.length} of {unannotatedIds.length}{" "}
                  selected
                </span>
                {!apiKey && (
                  <span style={{ fontSize: 12, color: "#633806" }}>
                    Set API key above to generate annotations
                  </span>
                )}
                <div style={{ marginLeft: "auto" }}>
                  <Btn
                    label={
                      annotatingAll
                        ? "Annotating..."
                        : `Generate annotations (${selectedToAnnotate.length})`
                    }
                    onClick={runAnnotations}
                    disabled={annotatingAll || !selectedToAnnotate.length}
                    bg="#EEEDFE"
                    color="#3C3489"
                    border="#CECBF6"
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: "0.4rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>Year:</span>
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYearFilter(y)}
                    style={{
                      fontSize: 12,
                      padding: "3px 10px",
                      borderRadius: 4,
                      border: `0.5px solid ${
                        yearFilter === y ? "#374151" : "#E5E7EB"
                      }`,
                      background: yearFilter === y ? "#F3F4F6" : "transparent",
                      color: "#374151",
                      cursor: "pointer",
                      fontWeight: yearFilter === y ? 500 : 400,
                    }}
                  >
                    {y}
                  </button>
                ))}
                <span
                  style={{ fontSize: 12, color: "#9CA3AF", margin: "0 4px" }}
                >
                  ·
                </span>
                <button
                  onClick={() => setAiOnly(!aiOnly)}
                  style={{
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 4,
                    border: `0.5px solid ${aiOnly ? "#7F77DD" : "#E5E7EB"}`,
                    background: aiOnly ? "#EEEDFE" : "transparent",
                    color: aiOnly ? "#3C3489" : "#374151",
                    cursor: "pointer",
                    fontWeight: aiOnly ? 500 : 400,
                  }}
                >
                  AI-related only
                </button>
                <span
                  style={{ fontSize: 12, color: "#9CA3AF", margin: "0 4px" }}
                >
                  ·
                </span>
                <button
                  onClick={() => setShowDismissed(!showDismissed)}
                  style={{
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 4,
                    border: `0.5px solid ${
                      showDismissed ? "#374151" : "#E5E7EB"
                    }`,
                    background: showDismissed ? "#F3F4F6" : "transparent",
                    color: "#374151",
                    cursor: "pointer",
                    fontWeight: showDismissed ? 500 : 400,
                  }}
                >
                  {showDismissed
                    ? `Showing dismissed (${dismissedCount})`
                    : `Dismissed (${dismissedCount})`}
                </button>
              </div>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 10px" }}>
                {filtered.length} paper{filtered.length !== 1 ? "s" : ""} shown
                · annotations based on abstracts
                {Object.keys(paperPdfs).length > 0
                  ? ` (${Object.keys(paperPdfs).length} with PDF)`
                  : ""}
              </p>
            </>
          )}

          {filtered.map((p) => {
            const isExp = expanded[p.id],
              abs = p.abstract || "",
              isSelected = selectedIds.includes(p.id);
            const badge = sourceBadge(p.source);
            const hasPdfText = !!paperPdfs[p.id];
            return (
              <div
                key={p.id}
                style={{
                  background: "#FFFFFF",
                  border: `0.5px solid ${isSelected ? "#378ADD" : "#E5E7EB"}`,
                  borderRadius: 10,
                  padding: "0.875rem 1.25rem",
                  marginBottom: 8,
                  display: "grid",
                  gridTemplateColumns: "20px 1fr",
                  gap: 12,
                  alignItems: "start",
                  opacity: p.dismissed ? 0.6 : 1,
                }}
              >
                {!p.dismissed ? (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(p.id)}
                    style={{
                      width: 16,
                      height: 16,
                      marginTop: 3,
                      cursor: "pointer",
                      accentColor: "#378ADD",
                    }}
                  />
                ) : (
                  <div />
                )}
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 6,
                      alignItems: "center",
                    }}
                  >
                    {p.isAiRelated && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "#EEEDFE",
                          color: "#3C3489",
                          border: "0.5px solid #CECBF6",
                        }}
                      >
                        AI-related
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: SEC_BG[p.section] || "#F3F4F6",
                        color: SEC_TX[p.section] || "#6B7280",
                      }}
                    >
                      {p.section}
                    </span>
                    {badge && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                    )}
                    {p.isOpenAccess && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "#E1F5EE",
                          color: "#085041",
                          border: "0.5px solid #9FE1CB",
                        }}
                      >
                        Open access
                      </span>
                    )}
                    {p.isPreprint && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "#F9FAFB",
                          color: "#6B7280",
                          border: "0.5px solid #E5E7EB",
                        }}
                      >
                        Preprint
                      </span>
                    )}
                    {p.needsPDF && !hasPdfText && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "#FEF9E7",
                          color: "#633806",
                          border: "0.5px solid #FAC775",
                        }}
                      >
                        No abstract · upload PDF
                      </span>
                    )}
                    {hasPdfText && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "#E1F5EE",
                          color: "#085041",
                          border: "0.5px solid #9FE1CB",
                        }}
                      >
                        PDF uploaded ✓
                      </span>
                    )}
                    {p.dismissed && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "#F3F4F6",
                          color: "#9CA3AF",
                        }}
                      >
                        Dismissed
                      </span>
                    )}
                    {p.annotating && (
                      <span style={{ fontSize: 11, color: "#534AB7" }}>
                        Annotating...
                      </span>
                    )}
                    {p.year && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#9CA3AF",
                          marginLeft: "auto",
                        }}
                      >
                        {p.year}
                      </span>
                    )}
                  </div>
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#111827",
                        textDecoration: "none",
                        lineHeight: 1.4,
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      {p.title}
                    </a>
                  ) : (
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        margin: "0 0 2px",
                        lineHeight: 1.4,
                      }}
                    >
                      {p.title}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      margin: "0 0 6px",
                    }}
                  >
                    {p.authors}
                    {p.venue ? ` · ${p.venue}` : ""}
                  </p>
                  {abs && abs.length > 20 && (
                    <div style={{ marginBottom: 4 }}>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6B7280",
                          margin: "0 0 3px",
                          lineHeight: 1.6,
                        }}
                      >
                        {isExp
                          ? abs
                          : abs.slice(0, 200) + (abs.length > 200 ? "..." : "")}
                      </p>
                      {abs.length > 200 && (
                        <button
                          onClick={() =>
                            setExpanded((e) => ({ ...e, [p.id]: !isExp }))
                          }
                          style={{
                            fontSize: 12,
                            color: "#2563EB",
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                          }}
                        >
                          {isExp ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {!p.dismissed && (
                      <button
                        onClick={() => dismissPaper(p.id)}
                        style={{
                          fontSize: 11,
                          padding: "3px 10px",
                          borderRadius: 6,
                          border: "0.5px solid #E5E7EB",
                          background: "transparent",
                          color: "#6B7280",
                          cursor: "pointer",
                        }}
                      >
                        Dismiss
                      </button>
                    )}
                    {p.dismissed && (
                      <button
                        onClick={() => restorePaper(p.id)}
                        style={{
                          fontSize: 11,
                          padding: "3px 10px",
                          borderRadius: 6,
                          border: "0.5px solid #E5E7EB",
                          background: "transparent",
                          color: "#6B7280",
                          cursor: "pointer",
                        }}
                      >
                        Restore
                      </button>
                    )}
                    {!p.dismissed && (
                      <button
                        onClick={() => {
                          setUploadingPdfForPaper(p.id);
                          pdfFileInputRef.current?.click();
                        }}
                        style={{
                          fontSize: 11,
                          padding: "3px 10px",
                          borderRadius: 6,
                          border: "0.5px solid #E5E7EB",
                          background: hasPdfText ? "#E1F5EE" : "transparent",
                          color: hasPdfText ? "#085041" : "#6B7280",
                          cursor: "pointer",
                        }}
                      >
                        {hasPdfText ? "Replace PDF" : "Upload PDF"}
                      </button>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#9CA3AF",
                      margin: "6px 0 0",
                    }}
                  >
                    Keyword: "{p.keyword}"
                  </p>
                </div>
              </div>
            );
          })}

          {!scanning && results.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1rem",
                background: "#FFFFFF",
                border: "0.5px solid #E5E7EB",
                borderRadius: 10,
              }}
            >
              <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 8px" }}>
                No scan results yet
              </p>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 4px" }}>
                Click "Run scan" to search {KEYWORDS.length} keywords across
                Semantic Scholar and CrossRef.
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
                No API key needed to scan — only needed to generate annotations.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── DOCUMENT EDITOR ── */}
      {view === "document" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                {inDoc.length} annotation{inDoc.length !== 1 ? "s" : ""} — click
                an insertion or card to highlight both
              </p>
              {uploadedDoc && (
                <p
                  style={{ fontSize: 12, color: "#059669", margin: "2px 0 0" }}
                >
                  Using uploaded: {uploadedDoc.filename}
                </p>
              )}
              {!uploadedDoc && (
                <p
                  style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}
                >
                  Using sample text — upload your .docx above for the full
                  document
                </p>
              )}
            </div>
            <Btn
              label={exporting ? "Exporting..." : "Export to Word"}
              onClick={handleExport}
              disabled={exporting || !inDoc.length}
              bg="#E1F5EE"
              color="#085041"
              border="#9FE1CB"
            />
          </div>

          {inDoc.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1rem",
                background: "#FFFFFF",
                border: "0.5px solid #E5E7EB",
                borderRadius: 10,
              }}
            >
              <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 8px" }}>
                No annotations yet
              </p>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 12px" }}>
                Select papers in the review queue, click "Generate annotations,"
                and they will appear here automatically.
              </p>
              <button
                onClick={() => setView("queue")}
                style={{
                  fontSize: 13,
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "0.5px solid #E5E7EB",
                  background: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                Go to review queue
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 300px",
                gap: 16,
                alignItems: "start",
              }}
            >
              {/* Document body */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "0.5px solid #E5E7EB",
                  borderRadius: 10,
                  padding: "1.5rem",
                }}
              >
                {docSections.map((sec, idx) => {
                  const secAnnos = inDoc.filter(
                    (p) =>
                      p.section === sec.key ||
                      (uploadedDoc &&
                        fuzzyMatchSection(sec.heading, SECTIONS_ORDER) ===
                          p.section)
                  );
                  return (
                    <div key={idx}>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          margin: "1.25rem 0 4px",
                          paddingBottom: 4,
                          borderBottom: "0.5px solid #E5E7EB",
                        }}
                      >
                        {sec.heading}
                      </p>
                      {sec.paragraphs.slice(0, 3).map((para, i) => (
                        <p
                          key={i}
                          style={{
                            fontSize: 13,
                            lineHeight: 1.8,
                            marginBottom: 8,
                            color: "#374151",
                          }}
                        >
                          {para}
                        </p>
                      ))}
                      {sec.paragraphs.length > 3 && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9CA3AF",
                            marginBottom: 8,
                          }}
                        >
                          + {sec.paragraphs.length - 3} more paragraphs
                        </p>
                      )}
                      {/* Inline tracked-change blocks */}
                      {secAnnos.map((p) => {
                        const anno = p.annotation;
                        const isActive = activeComment === p.id;
                        const borderColor =
                          TYPE_BORDER[anno?.type] || "#1D9E75";
                        const bgColor = isActive
                          ? TYPE_BG[anno?.type] || "#E1F5EE"
                          : "#F9FAFB";
                        return (
                          <div
                            key={p.id}
                            onClick={() =>
                              setActiveComment(
                                activeComment === p.id ? null : p.id
                              )
                            }
                            style={{
                              borderLeft: `3px solid ${borderColor}`,
                              background: bgColor,
                              padding: "8px 12px",
                              marginBottom: 10,
                              cursor: "pointer",
                              transition: "background 0.15s",
                              borderRadius: "0 4px 4px 0",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                marginBottom: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 500,
                                  color: TYPE_TX[anno?.type] || "#085041",
                                }}
                              >
                                + {anno?.type || "Annotation"}
                              </span>
                              <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                                ·
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "#6B7280",
                                  fontWeight: 500,
                                }}
                              >
                                {p.title.length > 50
                                  ? p.title.slice(0, 50) + "…"
                                  : p.title}
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: 13,
                                lineHeight: 1.7,
                                margin: "0 0 4px",
                                color: "#111827",
                              }}
                            >
                              {anno?.annotation}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: "#6B7280",
                                margin: 0,
                              }}
                            >
                              {p.authors}
                              {p.venue ? ` · ${p.venue}` : ""} · {p.year}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Sticky sidebar */}
              <div
                style={{
                  position: "sticky",
                  top: "1rem",
                  maxHeight: "calc(100vh - 2rem)",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {inDoc.map((p) => {
                  const isActive = activeComment === p.id,
                    isEditC = editingComment === p.id,
                    anno = p.annotation;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveComment(p.id)}
                      style={{
                        background: "#FFFFFF",
                        border: `0.5px solid ${
                          isActive
                            ? TYPE_TX[anno?.type] || "#378ADD"
                            : "#E5E7EB"
                        }`,
                        borderRadius: 10,
                        padding: 12,
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                          marginBottom: 4,
                          alignItems: "center",
                        }}
                      >
                        {anno?.type && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: TYPE_BG[anno.type] || "#F3F4F6",
                              color: TYPE_TX[anno.type] || "#6B7280",
                            }}
                          >
                            {anno.type}
                          </span>
                        )}
                        {p.isAiRelated && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 500,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "#EEEDFE",
                              color: "#3C3489",
                              border: "0.5px solid #CECBF6",
                            }}
                          >
                            AI
                          </span>
                        )}
                        {paperPdfs[p.id] && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "#E1F5EE",
                              color: "#085041",
                            }}
                          >
                            PDF
                          </span>
                        )}
                        {p.year && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#9CA3AF",
                              marginLeft: "auto",
                            }}
                          >
                            {p.year}
                          </span>
                        )}
                      </div>
                      {/* Clear source attribution */}
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          margin: "0 0 1px",
                          lineHeight: 1.4,
                          color: "#111827",
                        }}
                      >
                        {p.title.length > 55
                          ? p.title.slice(0, 55) + "..."
                          : p.title}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#6B7280",
                          margin: "0 0 6px",
                        }}
                      >
                        {p.authors}
                        {p.venue ? ` · ${p.venue}` : ""}
                      </p>
                      {anno?.claim && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "#9CA3AF",
                            margin: "0 0 6px",
                            fontStyle: "italic",
                            lineHeight: 1.4,
                          }}
                        >
                          Updates: "
                          {anno.claim.length > 70
                            ? anno.claim.slice(0, 70) + "..."
                            : anno.claim}
                          "
                        </p>
                      )}
                      <div
                        style={{
                          background: "#F9FAFB",
                          padding: "6px 10px",
                          borderLeft: `3px solid ${
                            TYPE_BORDER[anno?.type] || "#D1D5DB"
                          }`,
                          marginBottom: 8,
                          borderRadius: "0 4px 4px 0",
                        }}
                      >
                        {isEditC ? (
                          <textarea
                            value={
                              editCommentText[p.id] || anno?.annotation || ""
                            }
                            onChange={(e) =>
                              setEditCommentText((t) => ({
                                ...t,
                                [p.id]: e.target.value,
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: "100%",
                              fontSize: 12,
                              lineHeight: 1.6,
                              padding: 6,
                              border: "0.5px solid #D1D5DB",
                              borderRadius: 6,
                              background: "#FFFFFF",
                              color: "#111827",
                              resize: "vertical",
                              minHeight: 70,
                              boxSizing: "border-box",
                              fontFamily: "inherit",
                            }}
                          />
                        ) : (
                          <p
                            style={{
                              fontSize: 12,
                              color: "#111827",
                              margin: 0,
                              lineHeight: 1.6,
                            }}
                          >
                            {anno?.annotation}
                          </p>
                        )}
                      </div>
                      <div
                        style={{ marginBottom: 8 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p
                          style={{
                            fontSize: 11,
                            color: "#9CA3AF",
                            margin: "0 0 4px",
                          }}
                        >
                          Placement
                        </p>
                        <select
                          value={p.section}
                          onChange={(e) => moveAnnotation(p.id, e.target.value)}
                          style={{
                            fontSize: 12,
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "0.5px solid #D1D5DB",
                            background: "#FFFFFF",
                            color: "#111827",
                            width: "100%",
                          }}
                        >
                          {SECTIONS_ORDER.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div
                        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isEditC && (
                          <>
                            <button
                              onClick={() => {
                                setEditingComment(p.id);
                                setEditCommentText((t) => ({
                                  ...t,
                                  [p.id]: anno?.annotation || "",
                                }));
                              }}
                              style={{
                                fontSize: 11,
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "0.5px solid #FAC775",
                                background: "#FAEEDA",
                                color: "#633806",
                                cursor: "pointer",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => reannotatePaper(p.id)}
                              disabled={p.annotating}
                              style={{
                                fontSize: 11,
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "0.5px solid #E5E7EB",
                                background: "transparent",
                                color: p.annotating ? "#9CA3AF" : "#6B7280",
                                cursor: p.annotating
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                            >
                              Re-annotate
                            </button>
                            <button
                              onClick={() => removeFromDoc(p.id)}
                              style={{
                                fontSize: 11,
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "0.5px solid #E5E7EB",
                                background: "#FFFFFF",
                                color: "#6B7280",
                                cursor: "pointer",
                              }}
                            >
                              Remove
                            </button>
                          </>
                        )}
                        {isEditC && (
                          <>
                            <button
                              onClick={() => saveCommentEdit(p.id)}
                              style={{
                                fontSize: 11,
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "0.5px solid #9FE1CB",
                                background: "#E1F5EE",
                                color: "#085041",
                                cursor: "pointer",
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingComment(null)}
                              style={{
                                fontSize: 11,
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "0.5px solid #E5E7EB",
                                background: "#FFFFFF",
                                color: "#6B7280",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                      {anno?.footnote && (
                        <p
                          style={{
                            fontSize: 10,
                            color: "#9CA3AF",
                            margin: "6px 0 0",
                            fontStyle: "italic",
                            lineHeight: 1.4,
                          }}
                        >
                          Footnote: {anno.footnote}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
