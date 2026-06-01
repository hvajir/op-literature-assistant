export default async function handler(req, res) {
  const { query, year, apiKey } = req.query;
  const fields =
    "title,authors,year,venue,abstract,isOpenAccess,openAccessPdf,externalIds";
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
    query
  )}&fields=${fields}&limit=8&year=${year}`;

  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;

  const delays = [3000, 8000, 15000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const response = await fetch(url, { headers });
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
