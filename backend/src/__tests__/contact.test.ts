import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";

describe("POST /contact", () => {
  it("returns 400 when name or email is missing", async () => {
    const response = await request(app).post("/contact").send({
      message: "Hello",
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("returns 200 on valid contact submission", async () => {
    const response = await request(app).post("/api/contact").send({
      name: "Abebe Bikila",
      email: "abebe@example.com",
      message: "Inquiry about CS degree",
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("Abebe Bikila");
  });
});
