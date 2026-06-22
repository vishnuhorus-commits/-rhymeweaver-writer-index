# MASTER ARCHIVE SCHEMA V1

Purpose: give every source file, word, phrase, alliteration cluster, rhyme item, and review item a stable anchor so the archive can grow without losing anything.

This is an offline-first schema. It is designed for iPad HTML tools, Google Drive exports, CSV master indexes, and a later Supabase database. Supabase is not connected in V1.

---

## Safety rules

1. Originals are never deleted.
2. Processing creates new output files only.
3. Every run creates a run log.
4. Every source receives a stable `document_anchor`.
5. Every extracted item receives a stable item ID.
6. Review files are preserved, not discarded.
7. A-Z outputs are append-and-dedupe, never blind overwrite.
8. The database is built after the offline workflow proves stable.

---

## Folder map for Google Drive

Root folder:

```text
ALLITERATION_ARCHIVE_V1/
  01_RAW_IN/
  02_PROCESSING/
  03_OUTPUT_A_Z/
    A/
    B/
    C/
    D/
    E/
    F/
    G/
    H/
    I/
    J/
    K/
    L/
    M/
    N/
    O/
    P/
    Q/
    R/
    S/
    T/
    U/
    V/
    W/
    X/
    Y/
    Z/
    NON_AZ/
  04_MASTER_INDEX/
  05_PRODUCTION_DONE/
  06_REVIEW_REQUIRED/
  07_LOGS/
  08_BACKUPS/
```

---

## Core anchor fields

### `document_anchor`

Stable ID for the source document.

Suggested format:

```text
DOC_YYYYMMDD_HHMMSS_SOURCE_SLUG_HASH8
```

Example:

```text
DOC_20260621_153000_APPLE_NOTES_PART_01_A1B2C3D4
```

### `run_id`

Stable ID for one processing session.

Suggested format:

```text
RUN_YYYYMMDD_HHMMSS_TOOLNAME_HASH8
```

Example:

```text
RUN_20260621_153500_BLOCK_ALLITERATION_REPORTER_V1_E9F8A7B6
```

### `cluster_id`

Stable ID for an alliteration cluster.

Suggested format:

```text
CLU_LETTER_COUNT_HASH12
```

Example:

```text
CLU_W_004_51A6D3F9B2C0
```

### `phrase_id`

Stable ID for a phrase or alliterative line.

Suggested format:

```text
PHR_LETTER_HASH12
```

### `word_id`

Stable ID for one normalized word.

Suggested format:

```text
WRD_WORD_HASH8
```

---

## Master CSV files

All V1 tools should export CSVs matching these tables where possible.

### 1. `MASTER_DOCUMENT_INDEX.csv`

One row per source document.

```csv
document_anchor,source_name,source_type,original_filename,original_path,import_method,first_seen_at,last_processed_at,raw_character_count,raw_word_count,status,notes
```

### 2. `MASTER_RUN_LOG.csv`

One row per tool run.

```csv
run_id,tool_name,tool_version,run_started_at,run_finished_at,document_anchor,input_method,input_filename,input_character_count,input_word_count,total_segments,total_clusters,total_review_items,total_duplicates,output_files,status,notes
```

### 3. `MASTER_ALLITERATION_INDEX.csv`

One row per detected alliteration cluster.

```csv
cluster_id,document_anchor,run_id,letter,cluster_size,cluster_bucket,score,matched_words,normalized_cluster,original_phrase,source_segment,segment_index,start_char,end_char,detector_version,review_status,notes
```

### 4. `MASTER_WORD_INDEX.csv`

One row per normalized word.

```csv
word_id,word,first_letter,word_length,source_count,total_count,first_seen_document_anchor,first_seen_run_id,last_seen_at,status,notes
```

### 5. `MASTER_PHRASE_INDEX.csv`

One row per cleaned phrase or line.

```csv
phrase_id,document_anchor,run_id,first_letter,phrase_word_count,normalized_phrase,original_phrase,source_segment,segment_index,score,status,notes
```

### 6. `MASTER_RHYME_INDEX.csv`

One row per rhyme/sound relationship.

```csv
rhyme_id,word,word_id,rhyme_word,rhyme_word_id,rhyme_type,rhyme_level,phonetic_key,syllable_count,score,source,run_id,status,notes
```

### 7. `MASTER_REVIEW_INDEX.csv`

One row per preserved review item.

```csv
review_id,document_anchor,run_id,review_type,reason,original_text,normalized_text,source_segment,segment_index,start_char,end_char,status,notes
```

### 8. `MASTER_DUPLICATE_INDEX.csv`

One row per duplicate or possible duplicate.

```csv
duplicate_id,document_anchor,run_id,item_type,original_text,normalized_text,matched_existing_id,duplicate_type,confidence,status,notes
```

---

## Processing flow

```text
RAW SOURCE
  ↓
INTAKE: create document_anchor and run_id
  ↓
PRESERVE ORIGINAL: write original source reference into MASTER_DOCUMENT_INDEX
  ↓
CLEAN COPY: normalize safely without changing the original
  ↓
EXTRACT: words, phrases, alliteration clusters, review items
  ↓
ANCHOR: generate stable IDs
  ↓
GROUP: A-Z and count buckets
  ↓
EXPORT: master CSV + A-Z text + review + process log
  ↓
ARCHIVE: move outputs into Google Drive folders
```

---

## V1 tool responsibilities

### BUILD_BLOCK_ALLITERATION_REPORTER_V1

Must produce:

```text
MASTER_ALLITERATION_REPORT.csv
A_Z_ALLITERATION_REPORT.txt
REVIEW_NOT_DELETED.txt
PROCESS_LOG.txt
```

Recommended future export alignment:

```text
MASTER_ALLITERATION_INDEX.csv
MASTER_REVIEW_INDEX.csv
MASTER_RUN_LOG.csv
```

### RhymeWeaver Index

Must produce or map to:

```text
MASTER_WORD_INDEX.csv
MASTER_PHRASE_INDEX.csv
MASTER_RHYME_INDEX.csv
MASTER_DUPLICATE_INDEX.csv
```

---

## Database readiness

When Supabase is connected later, each CSV becomes a database table. The IDs above become primary keys or unique keys. Until then, Google Drive CSV files are the safe database.

No Supabase connection should be added until:

1. Offline HTML tools export stable CSVs.
2. Google Drive folder routing is tested.
3. Duplicate detection is working.
4. A-Z append-and-dedupe is proven.
5. At least one full test batch completes with logs.
