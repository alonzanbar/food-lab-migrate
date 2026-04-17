import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Camera, ImagePlus, Undo2, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranslationKey } from "@/i18n/translations";

const MAX_SIGNATURE_FILE_BYTES = 5 * 1024 * 1024;

export type NameSignatureSubmitPayload = {
  name: string;
  signatureFile: File | null;
  /** Prior URL when the user did not replace an existing uploaded signature */
  existingSignatureUrl: string | null;
};

export type NameSignatureFieldHandle = {
  prepareSubmit: () => Promise<NameSignatureSubmitPayload | null>;
};

type Point = { nx: number; ny: number };
type Stroke = { points: Point[] };

function parseInitial(raw: unknown): { name: string; signatureUrl: string | null } {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name : "";
    const url =
      typeof o.signatureUrl === "string"
        ? o.signatureUrl
        : typeof o.signature_url === "string"
          ? o.signature_url
          : null;
    if (name || url) return { name, signatureUrl: url };
  }
  if (typeof raw === "string" && raw.trim()) {
    return { name: raw.trim(), signatureUrl: null };
  }
  return { name: "", signatureUrl: null };
}

function safeFieldKeyForFile(fieldKey: string): string {
  const s = fieldKey.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
  return s.slice(0, 80) || "signature";
}

function canvasToPngFile(canvas: HTMLCanvasElement, fieldKey: string): Promise<File | null> {
  const base = safeFieldKeyForFile(fieldKey);
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new File([blob], `${base}-signature.png`, { type: "image/png" }));
      },
      "image/png",
      0.92,
    );
  });
}

type Props = {
  fieldKey: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  initialValue: unknown;
  translate: (key: TranslationKey) => string;
  lang: "he" | "en";
};

export const NameSignatureField = forwardRef<NameSignatureFieldHandle, Props>(
  function NameSignatureField(
    { fieldKey, label, required, disabled, initialValue, translate, lang },
    ref,
  ) {
    const parsed = parseInitial(initialValue);
    const [name, setName] = useState(parsed.name);
    const [initialSignatureUrl] = useState<string | null>(
      parsed.signatureUrl?.startsWith("http") ? parsed.signatureUrl : null,
    );
    const [voidedInitialSignature, setVoidedInitialSignature] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"sign" | "upload">("sign");
    const [nameError, setNameError] = useState<string | null>(null);
    const [sigError, setSigError] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const drawingRef = useRef<Stroke | null>(null);
    const nameInputRef = useRef<HTMLInputElement | null>(null);

    const paintStrokesOnContext = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        list: Stroke[],
        partial: Stroke | null,
      ) => {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "#0f172a";
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ctx.lineWidth = Math.max(2, 2 * dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const drawStroke = (stroke: Stroke) => {
          if (stroke.points.length < 2) return;
          ctx.beginPath();
          const p0 = stroke.points[0];
          ctx.moveTo(p0.nx * w, p0.ny * h);
          for (let i = 1; i < stroke.points.length; i++) {
            const p = stroke.points[i];
            ctx.lineTo(p.nx * w, p.ny * h);
          }
          ctx.stroke();
        };
        for (const stroke of list) drawStroke(stroke);
        if (partial) drawStroke(partial);
      },
      [],
    );

    const redraw = useCallback(
      (listOverride?: Stroke[]) => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        if (!canvas || !wrap) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = wrap.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width * dpr));
        const h = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const list = listOverride ?? strokes;
        paintStrokesOnContext(ctx, w, h, list, drawingRef.current);
      },
      [paintStrokesOnContext, strokes],
    );

    useEffect(() => {
      redraw();
    }, [redraw]);

    useEffect(() => {
      const wrap = wrapRef.current;
      if (!wrap || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => redraw());
      ro.observe(wrap);
      return () => ro.disconnect();
    }, [redraw]);

    useEffect(() => {
      return () => {
        if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
      };
    }, [uploadPreviewUrl]);

    function normPoint(clientX: number, clientY: number): Point | null {
      const wrap = wrapRef.current;
      if (!wrap) return null;
      const rect = wrap.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const nx = (clientX - rect.left) / rect.width;
      const ny = (clientY - rect.top) / rect.height;
      return {
        nx: Math.min(1, Math.max(0, nx)),
        ny: Math.min(1, Math.max(0, ny)),
      };
    }

    function onPointerDown(e: React.PointerEvent) {
      if (disabled) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const p = normPoint(e.clientX, e.clientY);
      if (!p) return;
      drawingRef.current = { points: [p] };
    }

    function onPointerMove(e: React.PointerEvent) {
      if (disabled || !drawingRef.current) return;
      e.preventDefault();
      const p = normPoint(e.clientX, e.clientY);
      if (!p) return;
      const last = drawingRef.current.points[drawingRef.current.points.length - 1];
      const dist = Math.hypot(p.nx - last.nx, p.ny - last.ny);
      if (dist < 0.002) return;
      drawingRef.current.points.push(p);
      redraw();
    }

    function endStroke() {
      const cur = drawingRef.current;
      drawingRef.current = null;
      if (!cur || cur.points.length < 2) return;
      setStrokes((prev) => [...prev, cur]);
      setVoidedInitialSignature(true);
      setSigError(null);
      setFileError(null);
    }

    function onPointerUp(e: React.PointerEvent) {
      if (drawingRef.current) {
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        endStroke();
      }
    }

    function onPointerLeave(e: React.PointerEvent) {
      if (drawingRef.current && e.buttons === 0) endStroke();
    }

    function handleClearPad() {
      setStrokes([]);
      drawingRef.current = null;
      if (initialSignatureUrl && !voidedInitialSignature) {
        setVoidedInitialSignature(true);
      }
      redraw();
    }

    function handleUndo() {
      setStrokes((prev) => prev.slice(0, -1));
    }

    function handleReplaceAll() {
      handleClearPad();
      setUploadFile(null);
      setUploadPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setVoidedInitialSignature(true);
      setSigError(null);
      setFileError(null);
      setActiveTab("sign");
    }

    function pickUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || disabled) return;
      if (!file.type.startsWith("image/")) {
        setFileError(translate("process.signature.invalidImageType"));
        return;
      }
      if (file.size > MAX_SIGNATURE_FILE_BYTES) {
        setFileError(translate("process.signature.fileTooLarge"));
        return;
      }
      setFileError(null);
      setSigError(null);
      setStrokes([]);
      drawingRef.current = null;
      setVoidedInitialSignature(true);
      setUploadFile(file);
      setUploadPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    }

    const showInitialPreview =
      initialSignatureUrl && !voidedInitialSignature && strokes.length === 0 && !uploadFile;

    useImperativeHandle(
      ref,
      () => ({
        prepareSubmit: async () => {
          setNameError(null);
          setSigError(null);
          const trimmed = name.trim();
          if (required && !trimmed) {
            setNameError(translate("process.name.required"));
            nameInputRef.current?.focus();
            return null;
          }

          const flush = drawingRef.current;
          drawingRef.current = null;
          const mergedStrokes =
            flush && flush.points.length >= 2 ? [...strokes, flush] : strokes;
          if (mergedStrokes !== strokes) {
            setStrokes(mergedStrokes);
          }

          let signatureFile: File | null = null;
          let existingSignatureUrl: string | null = null;

          if (mergedStrokes.length > 0) {
            const off = document.createElement("canvas");
            off.width = 600;
            off.height = 240;
            const ctx = off.getContext("2d");
            if (ctx) {
              paintStrokesOnContext(ctx, 600, 240, mergedStrokes, null);
              signatureFile = await canvasToPngFile(off, fieldKey);
            }
          } else if (uploadFile) {
            signatureFile = uploadFile;
          } else if (initialSignatureUrl && !voidedInitialSignature) {
            existingSignatureUrl = initialSignatureUrl;
          }

          if (required && !signatureFile && !existingSignatureUrl) {
            setSigError(translate("process.signature.required"));
            return null;
          }

          return {
            name: trimmed,
            signatureFile,
            existingSignatureUrl,
          };
        },
      }),
      [
        name,
        strokes,
        uploadFile,
        voidedInitialSignature,
        initialSignatureUrl,
        required,
        translate,
        fieldKey,
        paintStrokesOnContext,
      ],
    );

    const idName = `ns-name-${fieldKey}`;
    const idPad = `ns-pad-${fieldKey}`;

    if (disabled) {
      return (
        <div className="space-y-2 opacity-80">
          <Label>{label}{required ? " *" : ""}</Label>
          <p className="text-sm border rounded-md px-3 py-2 bg-muted">{name || "—"}</p>
          {(initialSignatureUrl || uploadPreviewUrl) && (
            <img
              src={uploadPreviewUrl || initialSignatureUrl || ""}
              alt=""
              className="max-h-40 rounded-md border object-contain bg-white"
            />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor={idName}>
            {label}
            {required ? " *" : ""}
          </Label>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            {translate("process.signature.blockHint")}
          </p>
          <Input
            ref={nameInputRef}
            id={idName}
            type="text"
            autoComplete="off"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(null);
            }}
            className="mt-1"
            dir={lang === "he" ? "rtl" : "ltr"}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? `${idName}-err` : undefined}
          />
          {nameError ? (
            <p id={`${idName}-err`} className="text-sm text-destructive mt-1">
              {nameError}
            </p>
          ) : null}
        </div>

        {showInitialPreview ? (
          <div className="space-y-2">
            <img
              src={initialSignatureUrl}
              alt=""
              className="max-h-40 w-full max-w-md rounded-md border object-contain bg-white"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleReplaceAll}>
              {translate("process.signature.replace")}
            </Button>
          </div>
        ) : uploadPreviewUrl && uploadFile ? (
          <div className="space-y-2">
            <img
              src={uploadPreviewUrl}
              alt=""
              className="max-h-40 w-full max-w-md rounded-md border object-contain bg-white"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleReplaceAll}>
                {translate("process.signature.replace")}
              </Button>
            </div>
          </div>
        ) : strokes.length > 0 ? (
          <div className="space-y-2">
            <div
              ref={wrapRef}
              className="relative w-full h-48 rounded-md border-2 border-muted-foreground/25 bg-muted/40 touch-none"
            >
              <canvas
                ref={canvasRef}
                id={idPad}
                className="absolute inset-0 h-full w-full cursor-crosshair"
                role="img"
                aria-label={translate("process.signature.signHereAria")}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onPointerLeave={onPointerLeave}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleUndo} className="min-h-11">
                <Undo2 className="h-4 w-4 me-1" aria-hidden />
                {translate("process.signature.undo")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleClearPad} className="min-h-11">
                <Eraser className="h-4 w-4 me-1" aria-hidden />
                {translate("process.signature.clear")}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleReplaceAll} className="min-h-11">
                {translate("process.signature.replace")}
              </Button>
            </div>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "sign" | "upload")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="sign" className="min-h-11">
                {translate("process.signature.tabSign")}
              </TabsTrigger>
              <TabsTrigger value="upload" className="min-h-11">
                {translate("process.signature.tabUpload")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sign" className="mt-3 space-y-2">
              <div
                ref={wrapRef}
                className="relative w-full h-48 rounded-md border-2 border-dashed border-muted-foreground/35 bg-background touch-none"
              >
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full cursor-crosshair"
                  role="img"
                  aria-label={translate("process.signature.signHereAria")}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onPointerLeave={onPointerLeave}
                />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  {translate("process.signature.signHere")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleUndo} disabled={strokes.length === 0} className="min-h-11">
                  <Undo2 className="h-4 w-4 me-1" aria-hidden />
                  {translate("process.signature.undo")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleClearPad} className="min-h-11">
                  <Eraser className="h-4 w-4 me-1" aria-hidden />
                  {translate("process.signature.clear")}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="upload" className="mt-3 space-y-3">
              <p className="text-sm text-muted-foreground">{translate("process.signature.uploadPhoto")}</p>
              <div className="flex flex-wrap gap-2">
                <Input
                  id={`${fieldKey}-cam`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={pickUploadFile}
                />
                <Button type="button" variant="outline" size="sm" className="gap-1 min-h-11" asChild>
                  <label htmlFor={`${fieldKey}-cam`} className="cursor-pointer">
                    <Camera className="h-4 w-4" />
                    {lang === "he" ? "מצלמה" : "Camera"}
                  </label>
                </Button>
                <Input
                  id={`${fieldKey}-gal`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={pickUploadFile}
                />
                <Button type="button" variant="outline" size="sm" className="gap-1 min-h-11" asChild>
                  <label htmlFor={`${fieldKey}-gal`} className="cursor-pointer">
                    <ImagePlus className="h-4 w-4" />
                    {lang === "he" ? "גלריה" : "Gallery"}
                  </label>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
        {sigError ? <p className="text-sm text-destructive">{sigError}</p> : null}
      </div>
    );
  },
);
