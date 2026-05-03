import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  finalizeMockPayment,
  isPaymentFlowError,
} from "../../server/payment/finalizeMockPayment.js";
import { isCreateBookingServiceError } from "../../server/services/createBookingService.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const requestId =
    typeof req.body?.requestId === "string" ? req.body.requestId.trim() : "";

  if (!requestId) {
    return res.status(400).json({
      message: "Missing requestId",
      code: "missing_request_id",
    });
  }

  try {
    const result = await finalizeMockPayment(requestId);

    return res.status(200).json(result);
  } catch (error: unknown) {
    if (isCreateBookingServiceError(error)) {
      return res.status(error.status).json({
        message: error.message,
        code: error.code,
      });
    }

    if (isPaymentFlowError(error)) {
      return res.status(error.status).json({
        message: error.message,
        code: error.code,
      });
    }

    console.error("Mock payment complete handler error:", error);

    return res.status(500).json({
      message: "Failed to complete mock payment",
      code: "mock_payment_complete_failed",
    });
  }
}