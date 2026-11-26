# Backups and restore

Written for audit item 1.8. As of 24 Nov 2026 the live `dynasty-estates`
project has **no backups**: Firestore point-in-time recovery is off and no
scheduled backups exist. Until the first two steps below are done, deleted or
overwritten data cannot be brought back.

Check each command against the current Google Cloud documentation before you
run it; the links are at the end. Every step that changes the live project
needs the owner's OK.

## 1. Switch backups on (once)

1. **Point-in-time recovery (PITR).** Firebase console → Firestore Database →
   Disaster Recovery → *Enable point-in-time recovery*. Keeps every version of
   every document for 7 days. Adds a storage cost on the Blaze plan.
2. **Scheduled backups**: a daily one, plus a weekly one kept longer for older
   history (check the current maximum retention for each in the docs):
   ```bash
   gcloud firestore backups schedules create --database='(default)' \
     --recurrence=daily --retention=7d --project=dynasty-estates
   gcloud firestore backups schedules create --database='(default)' \
     --recurrence=weekly --day-of-week=SUN --retention=14w --project=dynasty-estates
   ```
3. **Storage soft delete.** Check what the bucket keeps after a delete, and
   keep deleted files for 30 days:
   ```bash
   gcloud storage buckets describe gs://dynasty-estates.firebasestorage.app \
     --format="default(soft_delete_policy)"
   gcloud storage buckets update gs://dynasty-estates.firebasestorage.app \
     --soft-delete-duration=30d
   ```

## 2. Restore Firestore data

Never restore over the live database. Restore into a new, separate database,
check it, copy back only the documents you need, then delete the copy.

**From a scheduled backup** (any age the retention covers):
```bash
gcloud firestore backups list --project=dynasty-estates
gcloud firestore databases restore \
  --source-backup=projects/dynasty-estates/locations/nam5/backups/<backup-id> \
  --destination-database=restore-<yyyymmdd> --project=dynasty-estates
```

**From point-in-time recovery** (the last 7 days, to the minute): export the
collections you need as they were at that time, then import the export into a
scratch database:
```bash
gcloud firestore export gs://<scratch-bucket>/pitr-<yyyymmdd> \
  --snapshot-time=<RFC 3339 time on a whole minute> \
  --collection-ids=<collection,...> --project=dynasty-estates
```

Then copy the needed documents back to `(default)` with a short Admin SDK
script, kept outside the repo and reviewed by a second person, and delete the
scratch database.

## 3. Restore deleted Storage files

With soft delete on:
```bash
gcloud storage ls --soft-deleted gs://dynasty-estates.firebasestorage.app/listing-photos/<owner-uid>/
gcloud storage restore gs://dynasty-estates.firebasestorage.app/<path>#<generation>
```

## 4. What protects photos in the meantime

The nightly clean-up (`src/lib/server/storage-cleanup.ts`) deletes listing
files that no listing refers to. Since item 1.8 it first checks
(`src/lib/cleanup-guard.ts`) that its numbers look like an ordinary night, and
deletes nothing if the listings came back without file paths, if no bucket
file matches a listing's path, or if more than half of all files would go at
once. A held-back run is reported in the nightly ops alert.

## 5. Practise

Done-when for item 1.8: one collection restored from a backup into a scratch
database, and the steps above corrected wherever they turned out wrong. Repeat
the drill every quarter.

## Links

- Firestore point-in-time recovery: https://cloud.google.com/firestore/docs/pitr
- Firestore scheduled backups and restore: https://cloud.google.com/firestore/docs/backups
- Firestore export and import: https://cloud.google.com/firestore/docs/manage-data/export-import
- Cloud Storage soft delete: https://cloud.google.com/storage/docs/soft-delete
