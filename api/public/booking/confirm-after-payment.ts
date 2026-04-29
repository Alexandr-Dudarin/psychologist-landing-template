import { pool } from "../../../server/db/pool";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { requestId } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: "Missing requestId" });
  }

  const { serviceId, startsAt, firstName, lastName, email } = req.body;

  if (!serviceId || !startsAt) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    await pool.query(
      `
        INSERT INTO booking_payment_requests (request_id)
        VALUES ($1)
      `,
      [requestId]
    );

    return res.status(200).json({
      success: true,
      created: true,
    });
  } catch (error: any) {

    if (error.code === "23505") {
      return res.status(200).json({
        success: true,
        alreadyProcessed: true,
      });
    }

    console.error("Confirm booking error:", error);

    return res.status(500).json({
      error: "Failed to confirm booking",
    });
  }
}