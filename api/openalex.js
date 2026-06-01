export default async function handler(req, res) {
  const { query, fromYear, toYear } = req.query;
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(
    query
  )}&filter=publication_year:${fromYear}-${toYear}&per_page=10&select=id,title,authorships,publication_year,primary_location,abstract_inverted_index,open_access,doi&mailto=research@mit.edu`;

  const delays = [3000, 8000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "OP-Literature-Assistant (mailto:research@mit.edu)",
      },
    });
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
