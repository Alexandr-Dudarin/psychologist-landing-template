import { describe, expect, it } from "vitest";

import { filterClients } from "../../src/pages/admin/clients/clientsPageHelpers";
import {
  filterSessions,
  filterSessionsByFavoriteClients,
} from "../../src/pages/admin/sessions/sessionsPageHelpers";
import { filterNotes } from "../../src/pages/admin/notes/notesPageHelpers";
import {
  filterPackagePlans,
  filterServices,
} from "../../src/pages/admin/services/servicesPageHelpers";
import type { CrmClientRecord } from "../../src/types/client";
import type { CrmNoteRecord } from "../../src/types/note";
import type {
  CrmServicePackagePlanRecord,
  CrmServiceRecord,
} from "../../src/types/service";
import type { CrmSessionRecord } from "../../src/types/session";

function ids<T extends { id: number }>(items: T[]): number[] {
  return items.map((item) => item.id);
}

function makeClient(
  overrides: Partial<CrmClientRecord> & Pick<CrmClientRecord, "id" | "name">
): CrmClientRecord {
  return {
    id: overrides.id,
    name: overrides.name,
    phone: overrides.phone ?? "",
    email: overrides.email ?? "",
    source: overrides.source ?? "manual",
    status: overrides.status ?? "active",
    isFavorite: overrides.isFavorite ?? false,
    hasActivePackages: overrides.hasActivePackages ?? false,
    preferredContactMethod: overrides.preferredContactMethod ?? null,
    preferredContactValue: overrides.preferredContactValue ?? null,
    firstRequestId: overrides.firstRequestId ?? null,
    createdAt: overrides.createdAt ?? "2026-01-01T10:00:00.000Z",
  };
}

function makeSession(
  overrides: Partial<CrmSessionRecord> & Pick<CrmSessionRecord, "id">
): CrmSessionRecord {
  return {
    id: overrides.id,
    clientId: overrides.clientId ?? 1,
    clientName: overrides.clientName ?? "Anna Green",
    serviceId: overrides.serviceId ?? 10,
    serviceTitle: overrides.serviceTitle ?? "Consultation",
    scheduledAt: overrides.scheduledAt ?? "2026-01-02T10:00:00.000Z",
    durationMinutes: overrides.durationMinutes ?? 50,
    price: overrides.price ?? 5000,
    status: overrides.status ?? "scheduled",
    notes: overrides.notes ?? "",
    source: overrides.source ?? "manual",
    clientPackageId: overrides.clientPackageId ?? null,
    clientPackageCode: overrides.clientPackageCode ?? null,
    clientPackageTitle: overrides.clientPackageTitle ?? null,
    createdAt: overrides.createdAt ?? "2026-01-01T10:00:00.000Z",
  };
}

function makeNote(
  overrides: Partial<CrmNoteRecord> & Pick<CrmNoteRecord, "id">
): CrmNoteRecord {
  return {
    id: overrides.id,
    clientId: overrides.clientId ?? 1,
    clientName: overrides.clientName ?? "Anna Green",
    sessionId: overrides.sessionId ?? null,
    sessionScheduledAt: overrides.sessionScheduledAt ?? null,
    sessionServiceTitle: overrides.sessionServiceTitle ?? null,
    content: overrides.content ?? "",
    createdAt: overrides.createdAt ?? "2026-01-01T10:00:00.000Z",
  };
}

function makeService(
  overrides: Partial<CrmServiceRecord> & Pick<CrmServiceRecord, "id" | "title">
): CrmServiceRecord {
  return {
    id: overrides.id,
    title: overrides.title,
    description: overrides.description ?? "",
    price: overrides.price ?? 5000,
    durationMinutes: overrides.durationMinutes ?? 50,
    isActive: overrides.isActive ?? true,
    sessionsCount: overrides.sessionsCount ?? 0,
    createdAt: overrides.createdAt ?? "2026-01-01T10:00:00.000Z",
  };
}

function makePackagePlan(
  overrides: Partial<CrmServicePackagePlanRecord> &
    Pick<CrmServicePackagePlanRecord, "id" | "title">
): CrmServicePackagePlanRecord {
  return {
    id: overrides.id,
    serviceId: overrides.serviceId ?? 10,
    serviceTitle: overrides.serviceTitle ?? "Consultation",
    serviceDurationMinutes: overrides.serviceDurationMinutes ?? 50,
    serviceIsActive: overrides.serviceIsActive ?? true,
    title: overrides.title,
    description: overrides.description ?? "",
    sessionsCount: overrides.sessionsCount ?? 4,
    price: overrides.price ?? 18000,
    clientPackagesCount: overrides.clientPackagesCount ?? 0,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? "2026-01-01T10:00:00.000Z",
  };
}

describe("admin clients filtering helpers", () => {
  const clients = [
    makeClient({
      id: 1,
      name: "Anna Green",
      phone: "+15550000001",
      email: "anna@example.com",
      isFavorite: true,
    }),
    makeClient({
      id: 2,
      name: "Boris Stone",
      phone: "+15550000002",
      email: "boris@example.com",
      status: "inactive",
      isFavorite: true,
    }),
    makeClient({
      id: 3,
      name: "Clara Blue",
      phone: "+15559990003",
      email: "clara@example.com",
    }),
  ];

  it("keeps all clients for all filters and empty search", () => {
    expect(
      ids(
        filterClients(clients, {
          statusFilter: "all",
          favoriteFilter: "all",
          searchQuery: "   ",
        })
      )
    ).toEqual([1, 2, 3]);
  });

  it("filters clients by active and inactive status", () => {
    expect(
      ids(
        filterClients(clients, {
          statusFilter: "active",
          favoriteFilter: "all",
          searchQuery: "",
        })
      )
    ).toEqual([1, 3]);

    expect(
      ids(
        filterClients(clients, {
          statusFilter: "inactive",
          favoriteFilter: "all",
          searchQuery: "",
        })
      )
    ).toEqual([2]);
  });

  it("keeps only active favorite clients for favorite-only", () => {
    expect(
      ids(
        filterClients(clients, {
          statusFilter: "all",
          favoriteFilter: "favorites",
          searchQuery: "",
        })
      )
    ).toEqual([1]);
  });

  it("searches clients by name, phone, and email", () => {
    expect(
      ids(
        filterClients(clients, {
          statusFilter: "all",
          favoriteFilter: "all",
          searchQuery: "green",
        })
      )
    ).toEqual([1]);

    expect(
      ids(
        filterClients(clients, {
          statusFilter: "all",
          favoriteFilter: "all",
          searchQuery: "9990003",
        })
      )
    ).toEqual([3]);

    expect(
      ids(
        filterClients(clients, {
          statusFilter: "all",
          favoriteFilter: "all",
          searchQuery: "BORIS@EXAMPLE.COM",
        })
      )
    ).toEqual([2]);
  });
});

describe("admin sessions filtering helpers", () => {
  const sessions = [
    makeSession({
      id: 1,
      clientId: 1,
      clientName: "Anna Green",
      serviceId: 10,
      serviceTitle: "Consultation",
      notes: "Initial intake",
      status: "scheduled",
    }),
    makeSession({
      id: 2,
      clientId: 2,
      clientName: "Boris Stone",
      serviceId: 20,
      serviceTitle: "Family therapy",
      notes: "Follow-up plan",
      status: "completed",
    }),
    makeSession({
      id: 3,
      clientId: 3,
      clientName: "Clara Blue",
      serviceId: 10,
      serviceTitle: "Consultation",
      notes: "Cancelled by client",
      status: "cancelled",
    }),
  ];
  const favoriteClientIds = new Set([1, 3]);

  it("keeps all sessions for empty and all filter values", () => {
    expect(
      ids(
        filterSessions(sessions, favoriteClientIds, {
          clientFilter: "all",
          favoriteFilter: "all",
          searchQuery: " ",
          serviceFilter: "all",
          statusFilter: "all",
        })
      )
    ).toEqual([1, 2, 3]);
  });

  it("filters sessions by favorite clients", () => {
    expect(
      ids(filterSessionsByFavoriteClients(sessions, favoriteClientIds, "favorites"))
    ).toEqual([1, 3]);
  });

  it("filters sessions by client, status, and service", () => {
    expect(
      ids(
        filterSessions(sessions, favoriteClientIds, {
          clientFilter: 2,
          favoriteFilter: "all",
          searchQuery: "",
          serviceFilter: "all",
          statusFilter: "all",
        })
      )
    ).toEqual([2]);

    expect(
      ids(
        filterSessions(sessions, favoriteClientIds, {
          clientFilter: "all",
          favoriteFilter: "all",
          searchQuery: "",
          serviceFilter: "all",
          statusFilter: "cancelled",
        })
      )
    ).toEqual([3]);

    expect(
      ids(
        filterSessions(sessions, favoriteClientIds, {
          clientFilter: "all",
          favoriteFilter: "all",
          searchQuery: "",
          serviceFilter: 10,
          statusFilter: "all",
        })
      )
    ).toEqual([1, 3]);
  });

  it("searches sessions by client, service, and note", () => {
    expect(
      ids(
        filterSessions(sessions, favoriteClientIds, {
          clientFilter: "all",
          favoriteFilter: "all",
          searchQuery: "boris",
          serviceFilter: "all",
          statusFilter: "all",
        })
      )
    ).toEqual([2]);

    expect(
      ids(
        filterSessions(sessions, favoriteClientIds, {
          clientFilter: "all",
          favoriteFilter: "all",
          searchQuery: "family",
          serviceFilter: "all",
          statusFilter: "all",
        })
      )
    ).toEqual([2]);

    expect(
      ids(
        filterSessions(sessions, favoriteClientIds, {
          clientFilter: "all",
          favoriteFilter: "all",
          searchQuery: "initial",
          serviceFilter: "all",
          statusFilter: "all",
        })
      )
    ).toEqual([1]);
  });
});

describe("admin notes filtering helpers", () => {
  const clients = [
    makeClient({ id: 1, name: "Anna Green", isFavorite: true }),
    makeClient({ id: 2, name: "Boris Stone" }),
    makeClient({ id: 3, name: "Clara Blue", isFavorite: true }),
  ];
  const notes = [
    makeNote({
      id: 1,
      clientId: 1,
      clientName: "Anna Green",
      sessionId: 11,
      sessionServiceTitle: "Consultation",
      content: "Grounding exercise",
    }),
    makeNote({
      id: 2,
      clientId: 2,
      clientName: "Boris Stone",
      sessionId: 22,
      sessionServiceTitle: "Family therapy",
      content: "Discussed homework",
    }),
    makeNote({
      id: 3,
      clientId: 3,
      clientName: "Clara Blue",
      sessionId: null,
      sessionServiceTitle: null,
      content: "Standalone note",
    }),
  ];

  it("keeps all notes for empty and all filter values", () => {
    expect(
      ids(
        filterNotes(notes, clients, {
          clientFilter: "all",
          favoriteFilter: "all",
          searchQuery: " ",
        })
      )
    ).toEqual([1, 2, 3]);
  });

  it("filters notes by client and favorite clients", () => {
    expect(
      ids(
        filterNotes(notes, clients, {
          clientFilter: 2,
          favoriteFilter: "all",
          searchQuery: "",
        })
      )
    ).toEqual([2]);

    expect(
      ids(
        filterNotes(notes, clients, {
          clientFilter: "all",
          favoriteFilter: "favorites",
          searchQuery: "",
        })
      )
    ).toEqual([1, 3]);
  });

  it("searches notes by content, client, and service", () => {
    expect(
      ids(
        filterNotes(notes, clients, {
          clientFilter: "all",
          favoriteFilter: "all",
          searchQuery: "grounding",
        })
      )
    ).toEqual([1]);

    expect(
      ids(
        filterNotes(notes, clients, {
          clientFilter: "all",
          favoriteFilter: "all",
          searchQuery: "clara",
        })
      )
    ).toEqual([3]);

    expect(
      ids(
        filterNotes(notes, clients, {
          clientFilter: "all",
          favoriteFilter: "all",
          searchQuery: "family",
        })
      )
    ).toEqual([2]);
  });
});

describe("admin services filtering helpers", () => {
  const services = [
    makeService({
      id: 1,
      title: "Consultation",
      description: "Initial meeting",
    }),
    makeService({
      id: 2,
      title: "Family therapy",
      description: "Work with relatives",
      isActive: false,
    }),
    makeService({
      id: 3,
      title: "Supervision",
      description: "Professional support",
    }),
  ];
  const packagePlans = [
    makePackagePlan({
      id: 1,
      title: "Starter pack",
      description: "Four meetings",
      serviceTitle: "Consultation",
    }),
    makePackagePlan({
      id: 2,
      title: "Family bundle",
      description: "Six sessions",
      serviceTitle: "Family therapy",
      isActive: false,
    }),
    makePackagePlan({
      id: 3,
      title: "Pro plan",
      description: "For specialists",
      serviceTitle: "Supervision",
    }),
  ];

  it("filters services by activity and keeps all for all activity", () => {
    expect(ids(filterServices(services, "all", " "))).toEqual([1, 2, 3]);
    expect(ids(filterServices(services, "active", ""))).toEqual([1, 3]);
    expect(ids(filterServices(services, "inactive", ""))).toEqual([2]);
  });

  it("searches services by title and description", () => {
    expect(ids(filterServices(services, "all", "family"))).toEqual([2]);
    expect(ids(filterServices(services, "all", "support"))).toEqual([3]);
  });

  it("filters package plans by activity and keeps all for all activity", () => {
    expect(ids(filterPackagePlans(packagePlans, "all", " "))).toEqual([
      1, 2, 3,
    ]);
    expect(ids(filterPackagePlans(packagePlans, "active", ""))).toEqual([1, 3]);
    expect(ids(filterPackagePlans(packagePlans, "inactive", ""))).toEqual([2]);
  });

  it("searches package plans by title, description, and base service", () => {
    expect(ids(filterPackagePlans(packagePlans, "all", "starter"))).toEqual([1]);
    expect(ids(filterPackagePlans(packagePlans, "all", "six"))).toEqual([2]);
    expect(ids(filterPackagePlans(packagePlans, "all", "supervision"))).toEqual([
      3,
    ]);
  });
});
