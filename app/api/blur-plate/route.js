// app/api/blur-plate/route.js
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file) return Response.json({ results: [], fallback: true });

    const fd = new FormData();
    fd.append("upload", file, "car.jpg");
    fd.append("regions", "de");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
        method: "POST",
        headers: { Authorization: "Token a8f921f9a538ed3af6e796debf4e6a2e3059d080" },
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.status === 429) return Response.json({ results: [], fallback: true });
      const data = await res.json();
      return Response.json({ results: data.results || [] });
    } catch {
      clearTimeout(timeout);
      return Response.json({ results: [], fallback: true });
    }
  } catch {
    return Response.json({ results: [], fallback: true });
  }
}
