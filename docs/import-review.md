# Reviewed decision note import

In live mode, open Decision Records, paste text or choose a Markdown or plain-text file, and select **Extract draft**. The browser sends the text to `POST /api/imports/preview` within the authorized collection.

Hindsight Reflect receives the source text with a structured extraction schema. It proposes a title, problem, approach, outcome, reason, and final decision, plus one exact supporting passage per field. The backend discards any proposed value whose passage is absent from the submitted text. Unknown fields remain empty. Preview calls Hindsight but does not retain the source as memory or save it to the canonical database.

The review screen shows editable fields beside their source passages. The engineer fills the required fields and selects **Save reviewed decision**. Optional assumptions, alternatives, and conditions to reconsider can be added one per line. The browser sends the draft, passages, original text, and the preview's SHA-256 hash to `POST /api/imports`. The server verifies the hash and every passage's exact offset before saving. Human corrections should be checked against the original passage.

Saving inserts the approved decision, original text, source metadata, reviewer ID, and Hindsight outbox job in one SQLite transaction. The decision is ready after Retain succeeds or shown as pending if Hindsight is unavailable. `GET /api/decisions/:id/source` returns the stored note, hash, and passages only to the collection owner. The Decision Records and memory match screens let the owner open it. Source content is stored as plaintext in the protected backend database and sent to the configured Hindsight instance during preview.

`POST /api/imports/preview` accepts `{ "text": "...", "filename": "decision.md", "sourceUrl": "https://..." }`. Text is required and limited to 20,000 characters. The URL is optional and must use HTTP or HTTPS. `POST /api/imports` accepts the same fields plus `sourceHash`, an edited `draft`, and `passages` from preview. Normal decision validation requires nonempty title, problem, approach, outcome, and decision.

The memory test checks that a fabricated field without an exact source passage is discarded. The API test checks preview, source hash and passage validation, successful retention, source retrieval, and rejection of a different user's access.
