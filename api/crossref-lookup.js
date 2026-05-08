export default async function handler(req, res) {
    const { doi } = req.query;
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(response.status).json(data);
  }
