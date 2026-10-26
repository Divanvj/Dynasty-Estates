/** Checks whether dynasty-estates is on the Blaze (pay-as-you-go) plan. */
import { readFileSync } from "node:fs";
import { GoogleAuth } from "google-auth-library";

const key = JSON.parse(readFileSync("./dynasty-estates-firebase-adminsdk-fbsvc-1bc099603d.json", "utf8"));
const client = await new GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
}).getClient();

try {
  const { data } = await client.request({
    url: `https://cloudbilling.googleapis.com/v1/projects/${key.project_id}/billingInfo`,
  });
  console.log("billingEnabled:", data.billingEnabled === true);
  console.log("billingAccount:", data.billingAccountName || "(none)");
  console.log(data.billingEnabled ? "=> Blaze (pay-as-you-go)" : "=> Spark (free plan)");
} catch (e) {
  console.log("could not read billing:", e?.response?.status, e?.response?.data?.error?.message ?? e.message);
}
process.exit(0);
