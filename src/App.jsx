import { useState, useEffect, useCallback } from "react";
import JSZip from "jszip";

// ── Storage helpers (localStorage) ──────────────────────────────
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

// ── Keywords ────────────────────────────────────────────────────
const LENS_KEYWORDS = {
  structural: [
    {
      kw: "organizational design structure",
      section: "§1 Grouping",
      aiFlag: false,
    },
    { kw: "AI organizational design", section: "§1 Grouping", aiFlag: true },
    {
      kw: "matrix divisional structure",
      section: "§1 Grouping",
      aiFlag: false,
    },
    { kw: "hybrid work coordination", section: "§2 Linking", aiFlag: false },
    { kw: "human-AI teaming", section: "§2 Linking", aiFlag: true },
    { kw: "agentic AI coordination", section: "§2 Linking", aiFlag: true },
    {
      kw: "algorithmic management workers",
      section: "§3 Aligning",
      aiFlag: true,
    },
    { kw: "work design engagement", section: "§3 Aligning", aiFlag: false },
    {
      kw: "incentives performance measurement",
      section: "§3 Aligning",
      aiFlag: false,
    },
    {
      kw: "organizational restructuring costs",
      section: "§4 Redesign",
      aiFlag: false,
    },
    { kw: "AI organizational change", section: "§4 Redesign", aiFlag: true },
    {
      kw: "self-managing organizations",
      section: "§5 Less-hierarchical",
      aiFlag: false,
    },
    {
      kw: "flat hierarchy outcomes",
      section: "§5 Less-hierarchical",
      aiFlag: false,
    },
    {
      kw: "platform work regulation",
      section: "§6 Crowd-centric",
      aiFlag: false,
    },
    { kw: "AI gig workers", section: "§6 Crowd-centric", aiFlag: true },
  ],
  cultural: [
    {
      kw: "organizational culture symbols",
      section: "Meaning & Symbols",
      aiFlag: false,
    },
    { kw: "AI work meaning", section: "Meaning & Symbols", aiFlag: true },
    {
      kw: "institutional culture change",
      section: "Habits & History",
      aiFlag: false,
    },
    { kw: "occupational identity AI", section: "Identity", aiFlag: true },
    { kw: "workplace identity meaning", section: "Identity", aiFlag: false },
    { kw: "gig work identity", section: "Identity", aiFlag: true },
    { kw: "occupational subcultures", section: "Subcultures", aiFlag: false },
    {
      kw: "cross-cultural team collaboration",
      section: "Cross-Cultural Dynamics",
      aiFlag: false,
    },
    {
      kw: "distributed team culture",
      section: "Cross-Cultural Dynamics",
      aiFlag: false,
    },
    {
      kw: "AI remote team dynamics",
      section: "Cross-Cultural Dynamics",
      aiFlag: true,
    },
    {
      kw: "culture control motivation",
      section: "Culture, Control & Motivation",
      aiFlag: false,
    },
    {
      kw: "algorithmic surveillance workers",
      section: "Culture, Control & Motivation",
      aiFlag: true,
    },
    { kw: "gig economy culture", section: "Future of Culture", aiFlag: false },
    {
      kw: "AI platform labor culture",
      section: "Future of Culture",
      aiFlag: true,
    },
    {
      kw: "crowdwork occupational community",
      section: "Future of Culture",
      aiFlag: false,
    },
  ],
  political: [
    {
      kw: "positional power hierarchy",
      section: "Positional Power",
      aiFlag: false,
    },
    { kw: "AI decision authority", section: "Positional Power", aiFlag: true },
    {
      kw: "expertise power organizations",
      section: "Personal Power",
      aiFlag: false,
    },
    { kw: "AI expertise power shift", section: "Personal Power", aiFlag: true },
    { kw: "network brokerage power", section: "Network Power", aiFlag: false },
    {
      kw: "AI network analysis organizations",
      section: "Network Power",
      aiFlag: true,
    },
    {
      kw: "stakeholder interests conflict",
      section: "Interests & Stakeholders",
      aiFlag: false,
    },
    {
      kw: "AI change resistance stakeholders",
      section: "Interests & Stakeholders",
      aiFlag: true,
    },
    {
      kw: "coalition building organizations",
      section: "Building a Network",
      aiFlag: false,
    },
    {
      kw: "stakeholder mapping influence",
      section: "Using Power & Influence",
      aiFlag: false,
    },
    {
      kw: "AI power dynamics organizations",
      section: "Using Power & Influence",
      aiFlag: true,
    },
    {
      kw: "worker voice social media",
      section: "Future of Organizational Power",
      aiFlag: false,
    },
    {
      kw: "AI new power participatory",
      section: "Future of Organizational Power",
      aiFlag: true,
    },
    {
      kw: "platform worker power",
      section: "Future of Organizational Power",
      aiFlag: false,
    },
    {
      kw: "generative AI expertise power",
      section: "Personal Power",
      aiFlag: true,
    },
  ],
};
const LENS_LABELS = {
  structural: "Structural Design",
  cultural: "Cultural",
  political: "Political",
};

// ── Section claims (for annotation engine) ──────────────────────
const SECTION_CLAIMS = {
  "§1 Grouping": [
    '"Historically, organizations have used three basic forms or ideal types of grouping: functional structure, divisional structure, or matrix structure."',
    '"Coordination and communication are easier and denser within a unit than across units."',
    '"Career ladders are primarily within functions... there is a tendency for the number of levels of management in each function to expand over time."',
  ],
  "§2 Linking": [
    '"It is now commonplace for employees to spend significant amounts of their day collaborating using video conferencing technologies." (cites Neeley 2015)',
    '"Managers are using social media technologies to engage the entire organization in collective conversations." (cites Turco 2016)',
    '"Liaisons serve as conduits for information and expertise." [no AI coordination roles mentioned]',
    '"Organizations can also use special groups such as X-teams and task forces to link units." [no AI-augmented teams mentioned]',
  ],
  "§3 Aligning": [
    '"Variable pay should reward performance that is easy to measure, clear to the employee, and controllable by the employee."',
    '"When performance measures are incomplete, they drive behavior that is not perfectly aligned with organizational goals." (cites Pfeffer & Sutton 2006)',
    '"Seven key work design factors: clear goals, autonomy, resources, low time pressure, right help, psychological safety, and voice." (cites Amabile & Kramer 2011)',
  ],
  "§4 Redesign": [
    '"The most frequent stimulus to organizational design change is that the current design no longer fits the pressures from the external business environment."',
    '"One key cost of redesign is stress and anxiety for employees."',
    '"A key cost of redesign is the disruption of informal systems and processes."',
  ],
  "§5 Less-hierarchical": [
    '"Zappos adopted holacracy." / "Medium dropped holacracy, noting it was difficult to coordinate efforts at scale." (2016 examples)',
    '"Pressure from peers can actually be more stressful for employees than that from bosses." (cites Barker 1993)',
    '"Ambiguity and lack of clarity around progression, compensation and responsibilities led Zappos employees to leave."',
  ],
  "§6 Crowd-centric": [
    '"Platforms define themselves as neutral intermediaries not employers and thus bypass employment regulations."',
    '"Flash organizations: crowds structured like organizations to achieve complex and open-ended goals."',
    '"Microwork platforms like Amazon Mechanical Turk focus on relatively simple, repetitive tasks."',
  ],
  "Meaning & Symbols": [
    '"Culture provides a template on which meanings are read and actions are based." (Van Maanen)',
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
    '"Workers in service industries face emotional labor demands that create a complicated relationship between work identity and identity outside of work."',
  ],
  Subcultures: [
    '"Subcultures are present in every organization... groups of people who share common identities based on characteristics that often transcend their organizationally prescribed roles."',
    '"Engineers and marketers within the same company often have distinctive subcultures, which emerge from their occupational interests and educational backgrounds."',
  ],
  "Cross-Cultural Dynamics": [
    '"Despite attempts to leverage communication technologies to keep workers connected, subcultures often form in different locations."',
    '"Research suggests that having team members meet in person, giving them access to informal tools, and building a shared team identity can help."',
  ],
  "Culture, Control & Motivation": [
    '"Managers often attempt to increase worker motivation by providing socialization and symbols that reinforce the values they hope that employees will internalize."',
    '"Maintaining observability of workers may counterintuitively reduce their performance — creating a transparency paradox." (cites Bernstein 2012)',
    '"The attempt to loosen bureaucratic control ended up tightening the iron cage through a system of peer-based control." (cites Barker 1993)',
  ],
  "Future of Culture": [
    '"A host of changes, many technological, have given rise to a gig economy, a market system in which individuals and organizations contract with independent workers for short-term engagements."',
    '"Workers may experience algorithmic cruelty: hypervigilance despite claims of flexibility, isolation despite claims of autonomy, and not getting paid when technical failure is characterized as malfeasance."',
  ],
  "Positional Power": [
    '"Positional power is power stemming from formal hierarchical position... based on control over resource allocation, information flows, performance evaluation, and task assignments."',
    '"Excessive reliance on sanctions can transform authority into coercion, which is rarely accepted as legitimate."',
  ],
  "Personal Power": [
    '"Expertise — the mastery of a skill or body of knowledge that is both valued by the organization and relatively scarce — can be a significant source of power."',
    '"Track record, or past performance, is another source of personal power for both individuals and subunits."',
    '"Today, we see a similar phenomenon occurring with individuals or subunits involved in data analytics." (paralleling finance department power rise)',
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
    '"An effective network extends in three directions: upward to those in higher positions of formal authority, horizontally to those in adjacent units, and downward to those working for you."',
    '"It is important to build ties before you need them, to make networking a way of life."',
  ],
  "Using Power & Influence": [
    '"Those who are effective in organizations engage in stakeholder mapping, understand sources of resistance for each key stakeholder group, and tailor individual and collective influence tactics."',
  ],
  "Future of Organizational Power": [
    '"Social media — Web-based technologies that allow users to easily create, share and evaluate content — are having a transformative effect on society."',
    '"New power is more like a current: made by many, participatory and peer-driven; the goal is not to hoard it but to channel it." (cites Timms & Heimans 2018)',
    '"It is unclear whether the introduction of new technologies will facilitate a high degree of organizational or societal change."',
  ],
};

// ── Reading sections for document editor ────────────────────────
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
        "Within a single organization, the same symbol can have different meanings for different groups. Objects with different meanings for different groups can serve as boundary objects that allow different groups to collaborate on a common task.",
      ],
    },
    "Habits & History": {
      heading: "Habits and history",
      paragraphs: [
        "Culture emerges slowly and unevenly. It is dependent on what has worked in the past to sustain group endeavors and is consequently built on traditions and the experience of success.",
        "Even when regulation prohibited trainees working 120-hour weeks, many interns continued to work the long hours willingly — not because they were acquiring important expertise, but because they embraced the surgical iron man identity.",
      ],
    },
    Identity: {
      heading: "Identity",
      paragraphs: [
        "Work is a key source of identity for people, and scholars have shown how the workplace is an identity workspace for many workers.",
        "Because work can be a key area through which individuals derive their identities, changes in work that may seem minor for outsiders can deeply affect the identities of those performing the work.",
        "Even in service jobs, employees often find ways to exercise discretion over their labors, sometimes in ways that run counter to managerial goals.",
      ],
    },
    Subcultures: {
      heading: "Subcultures",
      paragraphs: [
        "Subcultures are present in every organization — groups of people who share common identities based on characteristics that often transcend their organizationally prescribed roles.",
        "Engineers and marketers within the same company often have distinctive subcultures, which emerge from their occupational interests and educational backgrounds.",
        "Subcultures can become problematic when organizational work requires that members of different subcultures collaborate with one another and their different cultures prevent them from doing so.",
      ],
    },
    "Cross-Cultural Dynamics": {
      heading: "Cross-cultural dynamics",
      paragraphs: [
        "In today's global economy, it is common for organization members to interact frequently with colleagues from different cultures. Subcultures often form in different locations.",
        "Research suggests that having team members be able to meet in person, giving them access to informal tools that facilitate spontaneous communication, and building a shared team identity can help members work together across locations.",
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
        "Workers on these platforms may experience algorithmic cruelty: hypervigilance despite claims of flexibility, isolation despite claims of autonomy, and not getting paid when technical failure is characterized as malfeasance. (Gray & Suri 2019)",
        "Crowdworkers often collaborate to fulfill technical and social needs, recreating the social connections and support often associated with brick-and-mortar work environments.",
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
        "Interests may be latent: that is, individuals may not realize they have a certain stakeholder interest until it is evoked by circumstances.",
      ],
    },
    "Building a Network": {
      heading: "Building a network",
      paragraphs: [
        "An effective network extends in three directions: upward to those in higher positions of formal authority, horizontally to those in adjacent units, and downward to those engaged in tasks that have important consequences for your own work.",
        "It is important to build ties before you need them, to make networking a way of life. We tend to build ties with people who are located close to us geographically or who are similar to us — but these ties are often less useful.",
      ],
    },
    "Using Power & Influence": {
      heading: "Using power and influence",
      paragraphs: [
        "Those who are effective in organizations engage in stakeholder mapping, understand sources of resistance for each key stakeholder group, and tailor individual and collective influence tactics to particular stakeholders.",
        "Stakeholder mapping is a key tactic for helping you identify the interests of those who will be affected by your planned change and how salient those interests are for them.",
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

// ── Utilities ────────────────────────────────────────────────────
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

// ── Word export ──────────────────────────────────────────────────
const CT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/></Types>`;
const PKG_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/></Relationships>`;
const SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:trackChanges/></w:settings>`;
const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="52"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:pPr><w:spacing w:after="320"/></w:pPr><w:rPr><w:color w:val="595959"/><w:sz w:val="26"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="480" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="FootnoteText"><w:name w:val="footnote text"/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style><w:style w:type="character" w:styleId="FootnoteReference"><w:name w:val="footnote reference"/><w:rPr><w:vertAlign w:val="superscript"/></w:rPr></w:style></w:styles>`;

function buildDocXml(annotated, sectionsOrder, readingSections, lensLabel) {
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
  lensLabel
) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CT_XML);
  zip.file("_rels/.rels", PKG_RELS);
  zip.file(
    "word/document.xml",
    buildDocXml(annotated, sectionsOrder, readingSections, lensLabel)
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

// ── API calls ────────────────────────────────────────────────────
async function claudeCall(prompt, useSearch = false, apiKey = "") {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  };
  if (useSearch)
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
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
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const d = await res.json();
  if (d.error) throw new Error(d.error.message);
  return (d.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function searchPapers(
  { kw, section, aiFlag },
  searchYears,
  searchPromptStr,
  apiKey
) {
  const prompt = `Find real academic papers ${searchPromptStr} about: "${kw}"\n\nJournals: Administrative Science Quarterly, Academy of Management Journal, Organization Science, Management Science, MIS Quarterly, ILR Review, Work and Occupations, New Technology Work and Employment, SSRN, arXiv.\n\nReturn ONLY a JSON array of up to 4 papers with keys: title, authors (up to 3 last names), year (integer), venue, abstract (2-3 sentences), url (or null), isOpenAccess (boolean).\n\nOnly real papers ${searchPromptStr}. Return fewer rather than fabricating. Response must be only the JSON array.`;
  const text = await claudeCall(prompt, true, apiKey);
  const parsed = extractJSON(text, "array");
  if (!parsed || !Array.isArray(parsed)) return [];
  const vL = (v) => String(v || "").toLowerCase();
  return parsed
    .filter(
      (p) => p && p.title && p.authors && searchYears.includes(Number(p.year))
    )
    .map((p, i) => ({
      id: `${normTitle(p.title)}-${i}-${Date.now()}`,
      title: String(p.title),
      authors: String(p.authors || ""),
      year: Number(p.year),
      venue: String(p.venue || ""),
      abstract: String(p.abstract || ""),
      url: p.url || null,
      isOpenAccess: aiFlag || Boolean(p.isOpenAccess),
      isPreprint:
        aiFlag || vL(p.venue).includes("arxiv") || vL(p.venue).includes("ssrn"),
      keyword: kw,
      section,
      aiFlag,
      annotation: null,
      dismissed: false,
    }));
}

async function annotatePaper(paper, apiKey) {
  const claims = (SECTION_CLAIMS[paper.section] || [])
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");
  const prompt = `You are a research assistant updating a 2019 MIT Sloan MBA reading on organizational behavior.\n\nPaper assigned to "${paper.section}":\nTitle: ${paper.title}\nAuthors: ${paper.authors}\nYear: ${paper.year}\nVenue: ${paper.venue}\nAbstract: ${paper.abstract}\n\nClaims in "${paper.section}" that could be updated:\n${claims}\n\nTasks:\n1. Pick the single claim this paper most directly updates\n2. Choose: "New citation", "Updated claim", "New example", or "Outdated flag"\n3. Write a 2-4 sentence draft annotation\n4. Write a Chicago-style footnote\n\nReturn ONLY a JSON object with keys: claim, type, annotation, footnote. No markdown.`;
  const text = await claudeCall(prompt, false, apiKey);
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

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [showApiInput, setShowApiInput] = useState(false);
  const [activeLens, setActiveLens] = useState("structural");
  const KEYWORDS = LENS_KEYWORDS[activeLens];
  const SECTIONS_ORDER = SECTIONS_ORDER_BY_LENS[activeLens];
  const READING_SECTIONS = READING_SECTIONS_BY_LENS[activeLens];

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

  // Load from localStorage on mount
  useEffect(() => {
    const k = lsGet("op_apikey");
    if (k) setApiKey(k);
    const lens = lsGet("op_activelens");
    if (lens) setActiveLens(lens);
    const fd = lsGet("op_fromdate");
    if (fd) setFromDate(fd);
    const d = lsGet("op_lastscan");
    if (d) setLastScan(d);
    const iso = lsGet("op_lastscaniso");
    if (iso) setLastScanISO(iso);
  }, []);

  // Load results when lens changes
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
    if (!apiKey) {
      setShowApiInput(true);
      return;
    }
    setScanning(true);
    setResults([]);
    setSelectedIds([]);
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
      try {
        all = [
          ...all,
          ...(await searchPapers(kw, searchYears, searchPromptStr, apiKey)),
        ];
      } catch (e) {
        errs = [...errs, { kw: kw.kw, err: e.message }];
      }
      await new Promise((r) => setTimeout(r, 500));
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
  }, [
    apiKey,
    fromDate,
    KEYWORDS,
    searchYears,
    searchPromptStr,
    persist,
    activeLens,
  ]);

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
        const anno = await annotatePaper(paper, apiKey);
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
      await new Promise((r) => setTimeout(r, 600));
    }
    setAnnotatingAll(false);
    setAnnoProgress((p) => ({ ...p, done: toAnno.length }));
    setSelectedIds((prev) =>
      prev.filter((id) => !toAnno.some((p) => p.id === id))
    );
    persist(updated);
  }, [apiKey, results, selectedIds, persist]);

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
        LENS_LABELS[activeLens]
      );
    } catch (e) {
      alert("Export failed: " + e.message);
    } finally {
      setExporting(false);
    }
  }, [results, SECTIONS_ORDER, READING_SECTIONS, activeLens]);

  const inDoc = results.filter(
    (p) => p.annotation && p.annotation.type !== "Error" && !p.dismissed
  );
  const dismissed = results.filter((p) => p.dismissed);
  const queuePapers = showDismissed
    ? results.filter((p) => p.dismissed)
    : results.filter((p) => !p.annotation && !p.dismissed);
  const filtered = queuePapers.filter((p) => {
    if (yearFilter !== "All" && String(p.year) !== yearFilter) return false;
    if (aiOnly && !p.aiFlag) return false;
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

  const Btn = ({ label, onClick, disabled, bg, color, border }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "7px 14px",
        fontSize: 12,
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
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: "#111827",
            }}
          >
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
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              margin: "0 0 8px",
              color: "#111827",
            }}
          >
            Anthropic API key
          </p>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px" }}>
            Your key is stored locally in your browser and never sent anywhere
            except directly to Anthropic. Get one at console.anthropic.com.
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
            onClick={() => setActiveLens(key)}
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

      {/* Date picker */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          background: "#F9FAFB",
          borderRadius: 8,
          border: "0.5px solid #E5E7EB",
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

      {/* Progress bars */}
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
            complete
          </p>
          {scanProgress.errors.length > 0 && (
            <p style={{ fontSize: 12, color: "#DC2626", margin: "4px 0 0" }}>
              {scanProgress.errors.length} error(s):{" "}
              {scanProgress.errors.map((e) => e.kw).join(", ")}
            </p>
          )}
        </div>
      )}
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
            {annoProgress.done} of {annoProgress.total} papers evaluated —
            results appear in document editor
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
                  AI-flag only
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
              </p>
            </>
          )}

          {filtered.map((p) => {
            const isExp = expanded[p.id],
              abs = p.abstract || "",
              isSelected = selectedIds.includes(p.id);
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
                    {p.aiFlag && (
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
                        AI-flag
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
                  {abs && (
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
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
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
              <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                Click "Run scan" to search {KEYWORDS.length} keyword queries for
                the {LENS_LABELS[activeLens]} lens
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
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
              {inDoc.length} annotation{inDoc.length !== 1 ? "s" : ""} — click a
              marker or comment to review
            </p>
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
                gridTemplateColumns: "1fr 320px",
                gap: 16,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  background: "#FFFFFF",
                  border: "0.5px solid #E5E7EB",
                  borderRadius: 10,
                  padding: "1.5rem",
                }}
              >
                {SECTIONS_ORDER.map((sec) => {
                  const sd = READING_SECTIONS[sec];
                  if (!sd) return null;
                  const secAnnos = inDoc.filter((p) => p.section === sec);
                  return (
                    <div key={sec}>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          margin: "1.25rem 0 4px",
                          paddingBottom: 4,
                          borderBottom: "0.5px solid #E5E7EB",
                        }}
                      >
                        {sd.heading}
                      </p>
                      {sd.paragraphs.map((para, i) => (
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
                      {secAnnos.map((p) => (
                        <div key={p.id} style={{ margin: "4px 0 8px" }}>
                          <span
                            onClick={() =>
                              setActiveComment(
                                activeComment === p.id ? null : p.id
                              )
                            }
                            style={{
                              display: "inline-block",
                              fontSize: 12,
                              padding: "3px 10px",
                              borderRadius: 4,
                              cursor: "pointer",
                              background:
                                activeComment === p.id
                                  ? TYPE_BG[p.annotation?.type] || "#E6F1FB"
                                  : "#F3F4F6",
                              color:
                                activeComment === p.id
                                  ? TYPE_TX[p.annotation?.type] || "#0C447C"
                                  : "#6B7280",
                              border: `0.5px solid ${
                                activeComment === p.id ? "#D1D5DB" : "#E5E7EB"
                              }`,
                              transition: "all 0.15s",
                            }}
                          >
                            &#x25B6; {p.authors.split(",")[0]} et al. {p.year} —{" "}
                            {p.annotation?.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
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
                          marginBottom: 6,
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
                        {p.aiFlag && (
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
                            AI-flag
                          </span>
                        )}
                        {p.isPreprint && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "#F9FAFB",
                              color: "#6B7280",
                            }}
                          >
                            Preprint
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
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          margin: "0 0 2px",
                          lineHeight: 1.4,
                        }}
                      >
                        {p.title.length > 60
                          ? p.title.slice(0, 60) + "..."
                          : p.title}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#6B7280",
                          margin: "0 0 8px",
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
                          {anno.claim.length > 80
                            ? anno.claim.slice(0, 80) + "..."
                            : anno.claim}
                          "
                        </p>
                      )}
                      <div
                        style={{
                          background: "#F9FAFB",
                          padding: "8px 10px",
                          borderLeft: `3px solid ${
                            TYPE_TX[anno?.type] || "#D1D5DB"
                          }`,
                          marginBottom: 8,
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
