// Prompt for converting a Vietnamese worship-song PDF to the SongsImportFile JSON shape.
// The PDF is sent as a separate inline-data part — this prompt does not include the raw text.

export const PDF_TO_SONGS_PROMPT = `You are converting Vietnamese worship song sheets into a structured JSON format for a slide presentation app.

The attached PDF contains one or more songs. Each song has:
- A title
- A section order line (e.g. "Intro(C) – V1 – C – V2 – C – Dạo(C) – V3 – C – C – Câu cuối")
- Labeled lyric sections (Verse 1, Chorus, Câu 1, Điệp khúc, Lời 1, Pre-Chorus, etc.)

Your task is to output a single JSON object in this exact format:

{
  "songs": [
    {
      "title": "<song title>",
      "order": ["<section label>", "<section label>", ...],
      "sections": {
        "<section label>": "<plain lyrics text>",
        ...
      }
    }
  ]
}

---

RULES:

1. STRIP ALL CHORD NOTATIONS
   Remove anything inside square brackets: [G], [C], [D7], [Em], [G/B], [C/E], [Gsus4], etc.
   Example:
     Input:  "[G]Chôn sâu dưới [C]mả u [G]minh, [D7]Jêsus Cứu [C]Chúa [G]tôi!"
     Output: "Chôn sâu dưới mả u minh, Jêsus Cứu Chúa tôi!"

2. STRIP LEADING DOTS
   Some lines begin with ".." — remove them.
   Example:
     Input:  "..xót thương con người"
     Output: "xót thương con người"

3. CLEAN UP EXTRA SPACES
   After removing chords and dots, collapse any extra spaces into single spaces.

4. SECTION LABELS — use the full human-readable name as the key
   - Use the same label in both "order" and "sections"
   - Choose natural Vietnamese or English labels based on what the sheet uses:
     - "Câu 1" / "Câu 2" / "Câu 3" (or "Verse 1" / "Verse 2" / "Verse 3")
     - "Điệp khúc" (or "Chorus")
     - "Pre-Chorus"
     - "Lời 1" / "Lời 2" / "Lời 3" / "Lời 4"
   - For instrumental/non-lyric entries: "Intro", "Dạo", "Câu cuối"
   - Use whatever name the sheet actually uses — be consistent between order and sections

5. PARSE THE ORDER LINE
   - The order line uses abbreviations separated by "–" or "-"
   - Map abbreviations to their full section labels:
     - V1 → "Câu 1" (or "Verse 1"), V2 → "Câu 2", V3 → "Câu 3"
     - C → "Điệp khúc" (or "Chorus")
     - P → "Pre-Chorus"
     - L1 → "Lời 1", L2 → "Lời 2", L3 → "Lời 3", L4 → "Lời 4"
     - Intro(C), Intro(anything) → "Intro"
     - Dạo(C), Dạo(anything) → "Dạo"
     - Câu cuối → "Câu cuối"
   - Cx3 means Chorus repeated 3 times — expand it to 3 separate entries:
     ["Điệp khúc", "Điệp khúc", "Điệp khúc"]
   - Sections that appear multiple times in the order are fine — same label repeated in the array

6. SECTIONS WITH NO LYRICS
   "Intro", "Dạo", "Câu cuối" typically have no lyrics.
   Do NOT include them in the "sections" object.
   They still appear in the "order" array — they will generate blank slides.

7. LYRICS FORMAT
   - Each section's lyrics is a single string
   - Lines within the section are separated by \\n (newline character)
   - Do NOT use blank lines between lines within the same section
   - Do NOT add section headers (like "Verse 1:") inside the lyrics text

8. MULTIPLE SONGS
   If the PDF contains multiple songs, include all of them in the "songs" array.

9. OUTPUT ONLY JSON
   Do not include any explanation, markdown code fences, or commentary — just the raw JSON.

---

Output a single JSON object only. No markdown fences. No explanation.`;
