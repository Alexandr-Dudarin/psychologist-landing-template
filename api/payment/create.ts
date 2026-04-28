import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const payload = req.body;

    // 💡 пока просто прокидываем payload в query (mock)
    const encoded = encodeURIComponent(JSON.stringify(payload));

    return res.status(200).json({
      confirmationUrl: `/payment-success?payload=${encoded}`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create mock payment",
    });
  }
}