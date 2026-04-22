/// <reference types="node" />

import {
  getPublicBookingAvailabilityData,
  getSingleQueryValue,
} from "../../../server/publicBooking/bookingAvailability";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawServiceId = getSingleQueryValue(req.query?.serviceId).trim();
  const rawDate = getSingleQueryValue(req.query?.date).trim();
  const rawMonth = getSingleQueryValue(req.query?.month).trim();
  const selectedServiceId = rawServiceId ? Number(rawServiceId) : null;
  const selectedDate = rawDate || null;
  const visibleMonth = rawMonth || null;

  try {
    const result = await getPublicBookingAvailabilityData({
      serviceId: selectedServiceId,
      selectedDate,
      visibleMonth,
    });

    if (!result.ok) {
      if (result.reason === "invalid_service") {
        return res.status(400).json({ error: "Некорректная услуга" });
      }

      if (result.reason === "invalid_date") {
        return res.status(400).json({ error: "Некорректная дата" });
      }

      if (result.reason === "invalid_month") {
        return res.status(400).json({ error: "Некорректный месяц" });
      }

      if (result.reason === "service_not_found") {
        return res.status(404).json({ error: "Услуга не найдена или отключена" });
      }

      return res.status(500).json({ error: "Не удалось загрузить настройки записи" });
    }

    return res.status(200).json(result.payload);
  } catch (error) {
    console.error("Public booking availability error:", error);
    return res.status(500).json({ error: "Не удалось загрузить доступные слоты" });
  }
}
