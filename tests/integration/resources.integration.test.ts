import { describe, it, expect, beforeAll } from "vitest";
import { getClient, DOMAIN, SKIP_PARITY } from "./setup.js";
import { loadFixtures, type Fixtures } from "./fixtures.js";
import { MaterialHeaderSchema } from "../../src/schemas/material.js";
import { ColorHeaderSchema } from "../../src/schemas/color.js";
import { ImageHeaderSchema } from "../../src/schemas/image.js";

// Golden coverage for the non-style resources (moved here from the ltd3 shape
// suite). Each test finds a known entity by id and asserts the live response
// contains the golden identity slice; headers also parse through their schema.
describe.skipIf(SKIP_PARITY)("Integration — other resources (golden comparison)", () => {
  const client = SKIP_PARITY ? (null as never) : getClient();
  let fx: Fixtures;
  beforeAll(() => {
    fx = loadFixtures(DOMAIN);
  });

  it("material: folder + header", async () => {
    const folders = await client.material.folders();
    const folder = folders.find((f) => f.id === fx.materialFolder.id);
    expect(folder, "material folder not found").toBeTruthy();
    expect(folder).toContainSubset(fx.materialFolder);

    const header = await client.material.get(fx.materialHeader.id);
    MaterialHeaderSchema.parse(header);
    expect(header).toContainSubset(fx.materialHeader);
  });

  it("color: folder + header", async () => {
    const folders = await client.color.folders();
    const folder = folders.find((f) => f.id === fx.colorFolder.id);
    expect(folder, "color folder not found").toBeTruthy();
    expect(folder).toContainSubset(fx.colorFolder);

    const header = await client.color.get(fx.colorHeader.id);
    ColorHeaderSchema.parse(header);
    expect(header).toContainSubset(fx.colorHeader);
  });

  it("image: folder + header", async () => {
    const folders = await client.image.folders();
    const folder = folders.find((f) => f.id === fx.imageFolder.id);
    expect(folder, "image folder not found").toBeTruthy();
    expect(folder).toContainSubset(fx.imageFolder);

    const header = await client.image.get(fx.imageHeader.id);
    ImageHeaderSchema.parse(header);
    expect(header).toContainSubset(fx.imageHeader);
  });

  it("directory: a known company", async () => {
    // The list `id` is transient / `directoryId` empty, so match a stable known
    // company (a test fixture company) by name in the default listing.
    const companies = await client.directory.list();
    const company = companies.find((c) => c.name === fx.directoryCompany.name);
    expect(company, "directory company not found").toBeTruthy();
    expect(company).toContainSubset(fx.directoryCompany);
  });

  it("users: a known user", async () => {
    const users = await client.user.list();
    const user = users.find((u) => u.email === fx.usersFirst.email);
    expect(user, "user not found").toBeTruthy();
    expect(user).toContainSubset(fx.usersFirst);
  });

  it("users: a known role", async () => {
    const roles = await client.user.roleList();
    const role = roles.find((r) => r.roleName === fx.roleFirst.roleName);
    expect(role, "role not found").toBeTruthy();
    expect(role).toContainSubset(fx.roleFirst);
  });

  it("master data: a known field", async () => {
    const field = await client.masterData.get(fx.masterDataField.fieldId);
    expect(field).toContainSubset(fx.masterDataField);
  });
});
