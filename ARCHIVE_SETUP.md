# HORUS shared archive connection

The homepage links to `archive.html`. The screen searches `public.entries` and accepts text lines, with source names attached. Originals are never moved or deleted. The Gilded Codex HTML and other books remain separate source artifacts until their exact phrase overlap and review rules are checked.

## Deployment settings

Set these three server environment variables on the **Vercel project that serves this repository**, for Production and Preview, then redeploy:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | The API URL of the existing `A_Z_BACKEND_SORTER` project |
| `SUPABASE_SERVICE_ROLE_KEY` | Its server only secret key; never put this in HTML or GitHub |
| `ARCHIVE_ACCESS_KEY` | A new long private passphrase for the archive screen |

Only `/api/archive` reads these values. Every request requires `X-Archive-Key`. The browser keeps the passphrase in memory for the current tab only. Do not put the passphrase in a URL. If the API says that settings are missing, verify this Vercel project's environment and redeploy. If it says to enter a key, the passphrase is missing or incorrect.

## Use

Open **Living A–Z Archive** on the homepage. Enter the archive key and click **Connect & search**. Choose a letter, enter a phrase, or filter by line length. Two word lines are slate, three teal, four gold, and five or more coral. Review lines are labeled. The first 100 matches appear with source labels; refine the search to see others. Select a word to see how many database entries contain that exact word and some recent examples. This is an entry count, not a judgement of quality or a count of every repeated use within a line.

To add, paste one phrase per line or select a UTF-8 `.txt` file and name its source. Click **Preview & select good lines**. The page shows 100, 250, or 500 lines at a time; each line has a checkbox. A line with at least three words and two content words sharing an initial is checked automatically. You can change the choices, then click **Save checked lines in this chunk**. The page sends 20 lines per request and shows progress. Repeating an interrupted save skips exact matches already in the database. New two word lines go to `REVIEW`; existing two word lines remain visible. Older rows with a missing word count need separate review.

This route does not bulk import the Gilded Codex or a second book automatically. Those sources need an audited, source-preserving overlap report first. Existing database counts are not the sum of the source file line counts.
