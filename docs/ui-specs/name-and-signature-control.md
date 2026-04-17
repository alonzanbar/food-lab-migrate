# Name and signature control (touch + upload)

UX spec for process step fields such as “שם וחתימה” / “Name and signature”.  
Companion to the in-chat design discussion; implementation is out of scope for this doc.

## 1. Context

- **Problem:** Plain text is a poor fit for real signatures on tablets/phones and for compliance parity with paper.
- **Users:** Shop-floor workers on phones/tablets (gloves, bright light, standing).
- **Constraints:** Touch signing **or** photo upload; RTL (Hebrew); align with existing step save flow and image storage (URL in `captured_data`).

## 2. Scope

### In scope

- One **block**: **Name** (text) + **Signature** (draw **or** upload image).
- Primary: **Sign here**; secondary: **Upload photo of signature**.
- **Clear** / optional **Undo** on pad; **Replace** when a signature exists.
- Required validation: name non-empty **and** signature present (drawn or uploaded).
- Disabled/read-only when step completed or form disabled.

### Out of scope

- Qualified / legal e-signatures, PDF tooling, witness signatures.
- Migrating every catalog step in the same change (this spec applies wherever the control is adopted).

## 3. Flow

### Primary

1. User reaches **Name and signature**.
2. Enters full name (single line, autocomplete off).
3. **Either** draws on pad **or** uploads image (camera/gallery); preview shown.
4. **Replace** clears current artifact and returns to choice (confirm if replacing server-persisted data—product call).
5. **Save / Finish step** submits name + signature artifact.

### Alternate / error

- Pad empty on required submit → inline error under block.
- Upload failure → retry; keep name.
- Wrong file type → only images; state allowed types.
- Oversized image → cap/compress with clear message (implementation).

## 4. Components (conceptual)

| Part | Role |
|------|------|
| Label | From schema + required * |
| Name input | Single line, full width, RTL |
| Hint | Short: sign with finger or upload photo |
| **Sign \| Upload** | One active mode |
| Signature pad | Large touch area (~160–200dp min height), neutral background, border |
| Pad actions | Clear all; optional Undo |
| Upload | Same visual weight as pad; camera + gallery on mobile |
| Preview | Thumbnail + Replace / Clear |

**States:** default, drawing, signed, uploaded, loading, error, disabled/read-only.

## 5. Interactions

- Clear pad: immediate; if required, block submit until redrawn.
- Replace: optional confirm when overwriting saved data.
- Submit: validate name + signature together; focus first invalid control.
- Persist: signature should end as **image URL** in payload (match existing `image` field upload pattern).

## 6. Responsive

- **Mobile/tablet:** vertical stack; pad full width; ≥44pt touch targets.
- **Desktop:** mouse on pad + upload + keyboard name.

## 7. Copy & i18n (suggested keys)

| Copy (EN) | Key |
|-----------|-----|
| Sign here | `process.signature.signHere` |
| Upload signature photo | `process.signature.uploadPhoto` |
| Clear signature | `process.signature.clear` |
| Undo | `process.signature.undo` |
| Replace signature | `process.signature.replace` |
| Signature required | `process.signature.required` |
| Name required | `process.name.required` |

Hebrew: short, professional (“חתום כאן”, “העלאת תמונת חתימה”, “נקה”, “נדרשת חתימה”, “נדרש שם”).

## 8. Accessibility

- Name: `<label>`, focus visible.
- Pad: accessible name; SR text: signature area, draw or use upload; **upload path** must be keyboard-complete.
- Focus order: Name → mode → pad/actions → Replace → next field.
- Contrast: AA; dark ink on light pad.

## 9. Acceptance criteria

- [ ] AC-1: Draw signature on touch; visible before submit.
- [ ] AC-2: Upload image instead; preview correct.
- [ ] AC-3: Clear / Replace work for both modes.
- [ ] AC-4: Required: block submit with clear errors if name or signature missing.
- [ ] AC-5: RTL: name RTL; bitmap handling consistent (no accidental mirror of strokes).
- [ ] AC-6: Completed step: read-only name + image when product forbids edit.
- [ ] AC-7: Keyboard users can complete via upload.

## 10. Open questions

- JSON shape: single URL vs `{ type: 'drawn'|'upload', url }` for audit.
- Max size / server compression.
- Schema: one compound field vs split `name` + `signature_image` for PDFs.
