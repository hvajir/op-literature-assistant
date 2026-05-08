export default async function handler(req, res) {
    const { query, year } = req.query;
    const fields = "title,authors,year,venue,abstract,isOpenAccess,openAccessPdf,externalIds";
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=${fields}&limit=5&year=${year}`;
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(response.status).json(data);
  }
