export default async function handler(req, res) {
    const { query, fromYear, toYear } = req.query;
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=8&select=DOI,title,author,published,container-title,abstract,URL`;
    const response = await fetch(url, { headers: { "User-Agent": "OP-Literature-Assistant (mailto:research@mit.edu)" } });
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(response.status).json(data);
  }
