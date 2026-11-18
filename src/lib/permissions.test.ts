import test from "node:test";
import assert from "node:assert/strict";
import { resolveEscolaAccess } from "./permissions";
import type { JWTPayload } from "./auth";
import { rolesWithCapability } from "../types/roles";

function usuario(overrides: Partial<JWTPayload>): JWTPayload {
  return {
    id: "usuario-1",
    email: "teste@escola.local",
    nome: "Teste",
    role: "LEITOR",
    escola_id: "escola-a",
    ...overrides,
  };
}

test("usuario global pode selecionar uma escola explicita", () => {
  const perfil = usuario({ role: "SUPER_ADMIN", escola_id: null });
  assert.equal(resolveEscolaAccess(perfil, "escola-b"), "escola-b");
});

test("usuario de escola nao pode consultar outra escola", () => {
  const perfil = usuario({ role: "ADMIN_ESCOLA", escola_id: "escola-a" });
  assert.equal(resolveEscolaAccess(perfil, "escola-b"), null);
  assert.equal(resolveEscolaAccess(perfil, "escola-a"), "escola-a");
});

test("guardas de pagina derivam da matriz central de capacidades", () => {
  assert.deepEqual(
    rolesWithCapability("manageUsuarios"),
    ["DEV_MASTER", "SUPER_ADMIN", "ADMIN_ESCOLA"]
  );
  assert.deepEqual(
    rolesWithCapability("viewAuditLogs"),
    ["DEV_MASTER", "SUPER_ADMIN"]
  );
  assert.deepEqual(
    rolesWithCapability("viewReports"),
    ["DEV_MASTER", "SUPER_ADMIN", "ADMIN_ESCOLA", "PROFESSOR", "LEITOR"]
  );
});
