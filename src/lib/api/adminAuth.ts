type AdminSessionResponse = {
  isAuthorized: boolean;
};

type LoginResponse = {
  success: true;
};

type ErrorResponse = {
  error: string;
};

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function loginAdmin(password: string): Promise<void> {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const errorData = await parseJsonSafe<ErrorResponse>(response);

    throw new Error(errorData?.error || "Не удалось выполнить вход.");
  }

  await parseJsonSafe<LoginResponse>(response);
}

export async function getAdminSession(): Promise<AdminSessionResponse> {
  const response = await fetch("/api/admin/me", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    return { isAuthorized: false };
  }

  const data = await parseJsonSafe<AdminSessionResponse>(response);

  return data ?? { isAuthorized: false };
}

export async function logoutAdmin(): Promise<void> {
  const response = await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await parseJsonSafe<ErrorResponse>(response);

    throw new Error(errorData?.error || "Не удалось выйти из админки.");
  }
}