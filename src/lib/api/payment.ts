export async function createPayment(payload: any) {
  const response = await fetch("/api/payment/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create payment");
  }

  return response.json();
}