import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import * as client from "../src/owox/client";

const KEY = "owox_key_" + Buffer.from(JSON.stringify({ apiOrigin: "https://o", apiKeyId: "k", apiKeySecret: "s" })).toString("base64url");

beforeEach(() => {
  vi.spyOn(client, "exchangeToken").mockResolvedValue("tok");
  vi.spyOn(client, "decodeProjectFromToken").mockReturnValue({ projectTitle: "Demo", fullName: "Vlad" });
});

describe("auth", () => {
  it("connect sets a session cookie and /me returns identity", async () => {
    const app = buildApp();
    const connect = await app.inject({ method: "POST", url: "/api/auth/connect", payload: { apiKey: KEY } });
    expect(connect.statusCode).toBe(200);
    const cookie = connect.cookies[0];
    expect(cookie.name).toBe("mc_sid");
    const me = await app.inject({ method: "GET", url: "/api/me", cookies: { mc_sid: cookie.value } });
    expect(me.json()).toMatchObject({ projectTitle: "Demo", fullName: "Vlad" });
  });
  it("/me without session is 401", async () => {
    const app = buildApp();
    expect((await app.inject({ method: "GET", url: "/api/me" })).statusCode).toBe(401);
  });
});
