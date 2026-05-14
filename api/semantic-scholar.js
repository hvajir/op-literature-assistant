export default async function handler(req, res) {
  const { query, year } = req.query;
  const fields =
    "title,authors,year,venue,abstract,isOpenAccess,openAccessPdf,externalIds";
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
    query
  )}&fields=${fields}&limit=8&year=${year}`;

  const delays = [3000, 8000, 15000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const response = await fetch(url);
    if (response.status === 429 && attempt < delays.length) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
      continue;
    }
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(response.status).json(data);
    return;
  }
}
