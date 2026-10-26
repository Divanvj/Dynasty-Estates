/** Registers the current cloudflared hostname in Firebase authorized domains. */
import { readFileSync } from "node:fs";
import { GoogleAuth } from "google-auth-library";

const KEY = "./dynasty-estates-firebase-adminsdk-fbsvc-1bc099603d.json";
const NEW_HOSTS = process.argv.slice(2);
if (!NEW_HOSTS.length) { console.error("usage: node add-domain.mjs <hostname> [more...]"); process.exit(1); }

const key = JSON.parse(readFileSync(KEY, "utf8"));
const client = await new GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
}).getClient();

const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${key.project_id}/config`;
const { data: current } = await client.request({ url: base });

// Drop stale trycloudflare hosts so the list does not grow without bound.
const kept = (current.authorizedDomains ?? []).filter((d) => !d.endsWith(".trycloudflare.com"));
const domains = [...new Set([...kept, ...NEW_HOSTS])];

const { data } = await client.request({
  url: `${base}?updateMask=authorizedDomains`,
  method: "PATCH",
  data: { authorizedDomains: domains },
});

console.log("Authorized domains now:");
(data.authorizedDomains ?? []).forEach((d) => console.log("  -", d));
console.log("\nphone enabled:", data.signIn?.phoneNumber?.enabled ? "yes" : "no");
process.exit(0);
