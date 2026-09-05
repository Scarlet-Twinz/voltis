const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  defaultCurrency: string;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  currency: string;
  balance: string;
  isActive: boolean;
};

export type Transaction = {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type TransactionsResponse = {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  volumeByCurrency: Record<string, string>;
  recent: Transaction[];
};

export type OverviewData = {
  organization: {
    id: string;
    name: string;
    slug: string;
    defaultCurrency: string;
  };
  payments: {
    total: number;
    volume: string;
    completed: number;
    failed: number;
    pending: number;
    processing: number;
    successRate: number;
  };
  transactions: {
    total: number;
    volume: string;
    completed: number;
    failed: number;
  };
  accounts: {
    total: number;
    balance: string;
  };
  ledger: {
    debits: string;
    credits: string;
    balanced: boolean;
  };
  risk: {
    total: number;
    allowed: number;
    review: number;
    blocked: number;
    averageScore: number;
  };
  reconciliation: {
    total: number;
    completed: number;
  };
};

function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("voltis_access_token");
}

export function setAccessToken(token: string): void {
  window.localStorage.setItem("voltis_access_token", token);
}

export function clearAccessToken(): void {
  window.localStorage.removeItem("voltis_access_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorBody: ApiErrorBody = {};

    try {
      errorBody = (await response.json()) as ApiErrorBody;
    } catch {
      // Ignore invalid/non-JSON responses.
    }

    const message = Array.isArray(errorBody.message)
      ? errorBody.message.join(", ")
      : errorBody.message ??
        errorBody.error ??
        "Request failed";

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function orgQuery(organizationId: string) {
  return `organizationId=${encodeURIComponent(organizationId)}`;
}

export const api = {
  auth: {
    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    login: (data: {
      email: string;
      password: string;
    }) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    me: () => request<AuthUser>("/auth/me"),
  },

  organizations: {
    list: () =>
      request<Organization[]>("/organizations"),

    create: (data: {
      name: string;
      slug: string;
      defaultCurrency: string;
    }) =>
      request<Organization>("/organizations", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    get: (organizationId: string) =>
      request<Organization>(
        `/organizations/${encodeURIComponent(organizationId)}`,
      ),
  },

  accounts: {
    list: (organizationId: string) =>
      request<Account[]>(
        `/accounts?${orgQuery(organizationId)}`,
      ),

    get: (accountId: string) =>
      request<Account>(
        `/accounts/${encodeURIComponent(accountId)}`,
      ),
  },

  transactions: {
    list: (organizationId: string) =>
      request<Transaction[]>(
        `/transactions?${orgQuery(organizationId)}`,
      ),

    get: (transactionId: string) =>
      request<Transaction>(
        `/transactions/${encodeURIComponent(transactionId)}`,
      ),

    analytics: (organizationId: string) =>
      request<TransactionsResponse>(
        `/analytics/transactions?${orgQuery(organizationId)}`,
      ),
  },

  payments: {
    list: (organizationId: string) =>
      request<unknown[]>(
        `/payments?${orgQuery(organizationId)}`,
      ),

    get: (paymentId: string) =>
      request<unknown>(
        `/payments/${encodeURIComponent(paymentId)}`,
      ),

    create: (data: Record<string, unknown>) =>
      request<unknown>("/payments", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    processInternal: (data: Record<string, unknown>) =>
      request<unknown>("/payments/process-internal", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  ledger: {
    entries: (transactionId: string) =>
      request<unknown[]>(
        `/ledger/transactions/${encodeURIComponent(transactionId)}`,
      ),

    createEntry: (data: Record<string, unknown>) =>
      request<unknown>("/ledger/entries", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  risk: {
    list: (organizationId: string) =>
      request<unknown[]>(
        `/risk?${orgQuery(organizationId)}`,
      ),

    payment: (paymentId: string) =>
      request<unknown>(
        `/risk/payments/${encodeURIComponent(paymentId)}`,
      ),
  },

  reconciliation: {
    list: (organizationId: string) =>
      request<unknown[]>(
        `/reconciliation?${orgQuery(organizationId)}`,
      ),

    get: (id: string) =>
      request<unknown>(
        `/reconciliation/${encodeURIComponent(id)}`,
      ),

    run: (organizationId: string) =>
      request<unknown>(
        `/reconciliation?${orgQuery(organizationId)}`,
        {
          method: "POST",
        },
      ),
  },

  webhooks: {
    endpoints: (organizationId: string) =>
      request<unknown[]>(
        `/webhooks/endpoints?${orgQuery(organizationId)}`,
      ),

    createEndpoint: (
      organizationId: string,
      data: Record<string, unknown>,
    ) =>
      request<unknown>(
        `/webhooks/endpoints?${orgQuery(organizationId)}`,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      ),

    deleteEndpoint: (id: string) =>
      request<void>(
        `/webhooks/endpoints/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      ),

    deliveries: (organizationId: string) =>
      request<unknown[]>(
        `/webhooks/deliveries?${orgQuery(organizationId)}`,
      ),
  },

  analytics: {
    overview: (organizationId: string) =>
      request<OverviewData>(
        `/analytics/overview?${orgQuery(organizationId)}`,
      ),

    payments: (organizationId: string) =>
      request<unknown>(
        `/analytics/payments?${orgQuery(organizationId)}`,
      ),

    transactions: (organizationId: string) =>
      request<TransactionsResponse>(
        `/analytics/transactions?${orgQuery(organizationId)}`,
      ),

    risk: (organizationId: string) =>
      request<unknown>(
        `/analytics/risk?${orgQuery(organizationId)}`,
      ),

    accounts: (organizationId: string) =>
      request<unknown>(
        `/analytics/accounts?${orgQuery(organizationId)}`,
      ),
  },
};