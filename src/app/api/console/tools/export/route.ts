import { consoleRoute, recordConsoleEvent } from "@/lib/server/console-auth";
import { readCollection, toMillis } from "@/lib/server/console-data";
import { KNOWN_COLLECTIONS } from "@/lib/server/platform-checks";

export const dynamic = "force-dynamic";

function cell(value: unknown): string {
  let text: string;
  const ms = typeof value === "object" && value !== null && !Array.isArray(value) ? toMillis(value) : null;
  if (value == null) text = "";
  else if (ms !== null) text = new Date(ms).toISOString();
  else if (typeof value === "object") text = JSON.stringify(value);
  else text = String(value);
  // Spreadsheet formula injection: a cell starting with = + - @ runs as a formula.
  if (/^[=+\-@]/.test(text)) text = `’${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV of one collection, for a spreadsheet. Logged, because it can hold personal data. */
export const GET = consoleRoute(async (request, caller) => {
  const name = new URL(request.url).searchParams.get("collection") ?? "";
  if (!(KNOWN_COLLECTIONS as readonly string[]).includes(name)) {
    return Response.json({ error: "Unknown collection." }, { status: 400 });
  }
  const { docs, capped } = await readCollection(name);
  const columns = ["id", ...new Set(docs.flatMap((d) => Object.keys(d.data)))];
  const lines = [
    columns.join(","),
    ...docs.map((d) => columns.map((c) => cell(c === "id" ? d.id : d.data[c])).join(",")),
  ];
  await recordConsoleEvent(caller, "tools.export", `Exported ${docs.length} ${name} document(s) as CSV`, {
    collection: name,
    rows: docs.length,
    capped,
  });
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});
