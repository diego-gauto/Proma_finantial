import { describe, expect, it } from "vitest";

import { AppError, toErrorMessage } from "./errors";

describe("AppError", () => {
  it("keeps a stable code, message, and status code", () => {
    const error = new AppError("DB_UNAVAILABLE", "Database is unavailable", 503);

    expect(error.code).toBe("DB_UNAVAILABLE");
    expect(error.message).toBe("Database is unavailable");
    expect(error.statusCode).toBe(503);
  });
});

describe("toErrorMessage", () => {
  it("returns error messages and hides unknown thrown values", () => {
    expect(toErrorMessage(new Error("Readable"))).toBe("Readable");
    expect(toErrorMessage("raw failure")).toBe("Unexpected error");
  });
});
