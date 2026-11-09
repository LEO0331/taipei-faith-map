# Monthly cultural content maintenance

[Monthly Cultural Content Review](../.github/workflows/monthly-content-review.yml) runs at UTC 01:23 on the eighth of each month, around 09:23 in Taipei. GitHub can delay or skip a scheduled run. Use **Actions → Monthly Cultural Content Review → Run workflow** on the default branch to perform a missed check. An operator can dispatch on a branch to inspect reports. The notification job runs only on the default branch. [GitHub workflow scheduling and permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)

The monitor starts from [臺北市已立案宗教團體點位資料](https://data.taipei/dataset/detail?id=86672d20-9c69-4c24-859b-078862c4e699) and resolves its currently listed ODS resource. It retrieves the source with bounded requests and a trusted-origin check. The converter normalizes the fields used by the map. The comparison detects additions, missing records, changed fields and ambiguous matches while ignoring row order and harmless formatting. It compares the published timestamp separately. Ambiguous identities are held for review before reporting additions or removals. A missing record does not establish that a site closed.

The source checks cover published references in profiles, traditions, events, routes, milestones and stories. The workflow reuses the curated audit and bounded HTTP checks. It records redirects without following them. HTTP 404 and 410 generate missing-source candidates. HTTP 403, rate limits and timeouts are inconclusive. Publisher metadata conflicts are reviewed through the existing audit. A page response cannot establish whether a historical claim changed. The calendar check uses Taipei dates and the existing 30-day review window. It reports nearby announced dates, ongoing or completed events and stale or inaccessible notices for manual follow-up.

## Reviewed baseline

The committed [baseline metadata](../scripts/monthly-content-baseline.json) identifies the owner-merged government data commit `ccf7cf1`, curated snapshot `e964b80`, and the 2026-11-09 comparison date. The canonical data is [religious-organizations.json](../public/data/religious-organizations.json). The file also records deterministic content signatures and the published dataset update timestamp observed when establishing the baseline. The government diff compares normalized field values. The signatures guard the inputs to the reviewed comparison.

The monitor re-runs the existing offline audit as of the baseline date against the matching reviewed inputs. Existing warnings receive deterministic fingerprints and the label **baseline-known**. New ages, event phases and changed observations can surface separately. When the tracked inputs differ from the baseline signatures, the workflow reports **Monitoring incomplete** and requests human review before a new comparison. The monitor never writes a baseline.

## Reports and the tracking issue

Every run writes a Step Summary and Markdown/JSON artifacts with 60-day retention. Reports include retrieval status, candidate counts, safe identifiers, source observations, calendar state and structural totals. The JSON retains the complete categorized findings. Raw ODS files and upstream error bodies stay out of artifacts and Issues.

| Overall result | Meaning |
| --- | --- |
| No material change detected | Checks completed. Only accepted baseline observations remain, or the difference was limited to published metadata. |
| Review recommended | A record, source or calendar observation needs review. |
| Attention required | A completed run found a structural audit problem. |
| Monitoring incomplete | A baseline, source retrieval or tracker-state check was incomplete. Read the individual results for any findings from checks that did complete. |

One bot-owned tracking Issue holds the unresolved finding IDs and evidence fingerprints in a bounded marker. New or changed actionable evidence creates or updates the tracker. An unchanged finding stays **previously-unresolved** and produces no write. When a conclusive check stops observing a tracked finding, the report records it as **no-longer-observed**. An inconclusive check carries prior evidence forward. An unreadable or ambiguous tracker suppresses notification until an operator reconciles it. Keep personal review notes in Issue comments because the bot maintains its own report body. The owner controls open and closed state.

The monitor job has repository and Issue read access. A separate notification job alone has Issue write access. The GitHub token is used only for the tracker API. The workflow leaves production deploy settings, reviewed data, historical claims, editorial statuses and verification dates under owner control.

## Operator workflow

1. Open the latest report and verify proposed changes against the official source. A source response or published timestamp is a lead for review.
2. Recheck a cultural claim against the original publication and match the exact current registered identity before updating the app. Review dated event notices with the organizer.
3. For a government data correction, download the ODS privately and pass its path explicitly to the existing converter. Inspect the normalized candidate output separately from the application data. Submit only reviewed changes through a separate PR.
4. When the owner approves revised data or curated inputs, generate new baseline metadata as an explicit step in the reviewed PR. Use the full reviewed commit IDs and the observed public timestamp only when confirmed:

   ```bash
   node --import tsx scripts/monthlyContentReview.ts --write-baseline YYYY-MM-DD DATASET_COMMIT CURATED_COMMIT
   ```

   The optional final argument accepts the observed published dataset update timestamp. This command writes the metadata file alone. A baseline review date does not reset individual source `verifiedAt` values.
5. After merge, dispatch the default-branch workflow and inspect both the artifact and Issue outcome. A delayed scheduled run can be recovered by manual dispatch.

To run the read-only comparison locally after `npm ci`:

```bash
node --import tsx scripts/monthlyContentReview.ts --out .supabase-test/monthly-review
```

This command writes reports locally and has no Issue credentials. The initial local check on 2026-11-09 retrieved 551 official records with zero normalized record changes. Of 29 cultural URLs, two returned HTTP 403. The report recorded 352 baseline-known findings, zero structural findings and one approaching Qingshan event review. Its overall result was **Monitoring incomplete** because of the two inconclusive source checks. Live Actions dispatch, tracker mutation and scheduled execution await merge and operator verification.
