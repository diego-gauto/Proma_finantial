import { beforeEach, describe, expect, it, vi } from "vitest";

import { listReviewDocuments } from "./documents.repository";
import { getDbPool } from "./client";

vi.mock("./client", () => ({
  getDbPool: vi.fn()
}));

describe("documents.repository", () => {
  beforeEach(() => {
    vi.mocked(getDbPool).mockReturnValue({
      query: vi.fn().mockResolvedValue({ rows: [] })
    } as never);
  });

  it("lists only active documents in the review queue", async () => {
    const pool = getDbPool();

    await listReviewDocuments();

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(vi.mocked(pool.query).mock.calls[0][0]).toContain("active = true");
  });
});
