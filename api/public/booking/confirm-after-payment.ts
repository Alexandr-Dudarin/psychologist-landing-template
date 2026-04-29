import { pool } from "../../../server/db/pool";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { serviceId, startsAt, firstName, lastName, email } = req.body;

  if (!serviceId || !startsAt) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    // 👉 тут пока просто создаём booking как раньше
    // (позже заменим на полноценную логику)

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to confirm booking",
    });
  }
}