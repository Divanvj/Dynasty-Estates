// S1-9: which certificate-expiry reminder is due, and when none is.
// Run: node tests/ffc-reminders.test.mjs   (Node 24 strips the TypeScript types)
import assert from "node:assert/strict";

import { dueFfcMilestone, FFC_REMINDER_DAYS, ffcMilestoneLabel, isFfcMilestone, sentMilestones, withMilestone } from "../src/lib/ffc-reminders.ts";

// Nothing is owed while the certificate is further out than the first step.
for (const daysLeft of [61, 90, 365, 10_000]) assert.equal(dueFfcMilestone(daysLeft), null, String(daysLeft));

// Each step opens on its own day and stays open until the next one.
assert.equal(dueFfcMilestone(60), 60);
assert.equal(dueFfcMilestone(45), 60);
assert.equal(dueFfcMilestone(31), 60);
assert.equal(dueFfcMilestone(30), 30);
assert.equal(dueFfcMilestone(8), 30);
assert.equal(dueFfcMilestone(7), 7);
assert.equal(dueFfcMilestone(1), 7);
assert.equal(dueFfcMilestone(0), 7);

// A missed night does not lose the reminder: on day 29 the 30-day step is
// still owed, which is the whole reason this is not an equality check.
assert.equal(dueFfcMilestone(29, []), 30);
assert.equal(dueFfcMilestone(29, [60]), 30);

// Sent once, never again for that step.
assert.equal(dueFfcMilestone(30, [30]), null);
assert.equal(dueFfcMilestone(29, [60, 30]), null);
assert.equal(dueFfcMilestone(5, [60, 30]), 7);
assert.equal(dueFfcMilestone(5, [60, 30, 7]), null);

// An agent who files late still gets the step they are actually in, and only
// that one — not three e-mails at once.
assert.equal(dueFfcMilestone(4, []), 7);
assert.equal(dueFfcMilestone(20, []), 30);

// Expired is the portal's job, not this e-mail's.
for (const daysLeft of [-1, -30, -400]) assert.equal(dueFfcMilestone(daysLeft), null, String(daysLeft));

// A date that could not be read at all.
assert.equal(dueFfcMilestone(null), null);
assert.equal(dueFfcMilestone(Number.NaN), null);

// The steps themselves.
assert.deepEqual([...FFC_REMINDER_DAYS], [60, 30, 7]);
for (const m of FFC_REMINDER_DAYS) assert.equal(isFfcMilestone(m), true, String(m));
for (const value of [0, 1, 45, "60", null, undefined, {}]) assert.equal(isFfcMilestone(value), false, String(value));

assert.equal(ffcMilestoneLabel(60), "60 days");
assert.equal(ffcMilestoneLabel(30), "30 days");
assert.equal(ffcMilestoneLabel(7), "a week");

// What has been sent is remembered against one expiry date.
assert.deepEqual(sentMilestones({ ffcExpiry: "2027-01-05", sent: [60, 30] }, "2027-01-05"), [60, 30]);

// Renewal: a new date on the certificate starts the run again, so the agent is
// reminded about next year's expiry too.
assert.deepEqual(sentMilestones({ ffcExpiry: "2027-01-05", sent: [60, 30, 7] }, "2028-01-05"), []);
assert.equal(dueFfcMilestone(45, sentMilestones({ ffcExpiry: "2027-01-05", sent: [60] }, "2028-01-05")), 60);

// Rubbish in the record never becomes a step.
assert.deepEqual(sentMilestones(undefined, "2027-01-05"), []);
assert.deepEqual(sentMilestones({}, "2027-01-05"), []);
assert.deepEqual(sentMilestones({ ffcExpiry: "2027-01-05" }, "2027-01-05"), []);
assert.deepEqual(sentMilestones({ ffcExpiry: "2027-01-05", sent: "60" }, "2027-01-05"), []);
assert.deepEqual(sentMilestones({ ffcExpiry: "2027-01-05", sent: [60, 14, null, "30", 0] }, "2027-01-05"), [60, 30]);

// Writing one back: no duplicates, furthest first.
assert.deepEqual(withMilestone([], 60), [60]);
assert.deepEqual(withMilestone([60], 30), [60, 30]);
assert.deepEqual(withMilestone([60, 30], 30), [60, 30]);
assert.deepEqual(withMilestone([30, 60], 7), [60, 30, 7]);

console.log("ffc-reminders: ok");
