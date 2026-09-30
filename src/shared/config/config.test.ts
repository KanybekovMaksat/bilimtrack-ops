import { describe, expect, it } from "vitest";
import { afterLogin, loginFor } from "./index";

describe("loginFor", () => {
  it("remembers the requested page with its filters", () => {
    expect(loginFor("/tickets?category=technical&source=telegram")).toBe("/login?next=%2Ftickets%3Fcategory%3Dtechnical%26source%3Dtelegram");
  });

  it("adds nothing for home and for the login page itself", () => {
    expect(loginFor("/")).toBe("/login");
    expect(loginFor("/login?next=%2Forgs")).toBe("/login");
  });
});

describe("afterLogin", () => {
  it("returns to the remembered page", () => {
    expect(afterLogin(new URL(loginFor("/orgs/5?tab=modules#x"), "http://x").search)).toBe("/orgs/5?tab=modules#x");
  });

  it.each(["", "?next=", "?next=//evil.com", "?next=https://evil.com", "?next=/%5Cevil.com", "?next=/login", "?next=javascript:alert(1)"])(
    "falls back to home for %j",
    (search) => expect(afterLogin(search)).toBe("/"),
  );
});
