import { pool } from "../../../server/db/pool";
import { createBookingService } from "../../../server/services/createBookingService";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { requestId } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: "Missing requestId" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO booking_payment_requests (request_id)
        VALUES ($1)
      `,
      [requestId]
    );

    const result = await createBookingService(client, req.body);

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      created: true,
      booking: result.booking,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");

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
  } finally {
    client.release();
  }
}