"use client";

import { useState, useCallback } from "react";
import SettingsPanel, { GenerateParams } from "@/components/SettingsPanel";
import { useHistoryStore, type HistoryEntry } from "@/stores/history";

const DEFAULTS: GenerateParams = {
  prompt: "",
  negative_prompt: "",
  num_inference_steps: 1,
  guidance_scale: 0.0,
  width: 1024,
  height: 1024,
  seed: "",
};

interface Result {
  image: string;
  seed: number;
}

export default function Home() {
  const [params, setParams]     = useState<GenerateParams>(DEFAULTS);
  const [result, setResult]     = useState<Result | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [elapsed, setElapsed]   = useState<number | null>(null);
  const { entries: history, addEntry, removeEntry, clearHistory } = useHistoryStore();
  const [viewedEntry, setViewedEntry] = useState<HistoryEntry | null>(null);

  async function generate() {
    if (!params.prompt.trim()) return;

    setLoading(true);
    setError(null);
    setViewedEntry(null);
    const start = Date.now();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
        body: JSON.stringify({
          ...params,
          negative_prompt: params.negative_prompt || null,
          num_inference_steps: Number(params.num_inference_steps),
          guidance_scale: Number(params.guidance_scale),
          width: Number(params.width),
          height: Number(params.height),
          seed: params.seed ? Number(params.seed) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      setResult(data);
      setElapsed((Date.now() - start) / 1000);
      addEntry({
        image: data.image,
        seed: data.seed,
        prompt: params.prompt,
        negative_prompt: params.negative_prompt,
        num_inference_steps: Number(params.num_inference_steps),
        guidance_scale: Number(params.guidance_scale),
        width: Number(params.width),
        height: Number(params.height),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reuseSeed() {
    if (result) setParams((p) => ({ ...p, seed: String(result.seed) }));
  }

  const viewFromHistory = useCallback((entry: HistoryEntry) => {
    setResult({ image: entry.image, seed: entry.seed });
    setViewedEntry(entry);
    setElapsed(null);
  }, []);

  function download() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${result.image}`;
    a.download = `${result.seed}.png`;
    a.click();
  }

  const canSubmit = params.prompt.trim().length > 0 && !loading;

  const displayParams = viewedEntry ?? {
    prompt: params.prompt,
    negative_prompt: params.negative_prompt,
    num_inference_steps: Number(params.num_inference_steps),
    guidance_scale: Number(params.guidance_scale),
    width: Number(params.width),
    height: Number(params.height),
    seed: result?.seed ?? 0,
  };

  return (
    <main className="min-h-screen bg-bg text-text font-ui text-sm leading-relaxed">
      <header className="flex items-center px-8 py-6 border-b border-border">
        <h1 className="font-display text-[22px] font-extrabold tracking-tight text-text">
          image<span className="text-accent">gen</span>
        </h1>
      </header>

      <div className="grid grid-cols-[360px_1fr] h-[calc(100vh-65px)]">
        <section className="flex flex-col gap-4 p-6 border-r border-border overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <textarea
              className="w-full bg-surface border border-border rounded-sm text-text font-ui text-sm leading-relaxed p-3 resize-y transition-[border-color] duration-150 focus:outline-none focus:border-accent placeholder:text-muted"
              placeholder="Describe the image…"
              value={params.prompt}
              onChange={(e) => setParams((p) => ({ ...p, prompt: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
              }}
              rows={4}
            />
            <span className="text-[11px] text-dim text-right">⌘ Enter to generate</span>
          </div>

          <SettingsPanel params={params} onChange={setParams} />

          <button
            className="flex items-center justify-center gap-2 w-full min-h-12 bg-accent text-[#0d0d0d] rounded-sm font-display text-[15px] font-bold tracking-wide transition-[background,opacity] duration-150 hover:bg-[#d9ff50] disabled:opacity-35 disabled:cursor-not-allowed"
            onClick={generate}
            disabled={!canSubmit}
          >
            {loading ? (
              <span className="inline-block w-[18px] h-[18px] border-2 border-[rgba(13,13,13,0.3)] border-t-[#0d0d0d] rounded-full animate-spin" />
            ) : (
              "Generate"
            )}
          </button>

          {error && (
            <p className="text-error text-[13px] border border-[#3a1a1a] bg-[#1e0e0e] rounded-sm px-3 py-2.5">
              {error}
            </p>
          )}
        </section>

        <section className="relative flex flex-col items-center justify-start p-8 bg-surface overflow-y-auto">
          {result ? (
            <>
              <div className="flex items-center justify-center max-w-full max-h-[calc(100vh-145px)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${result.image}`}
                  alt={params.prompt}
                  className="max-w-full max-h-[calc(100vh-145px)] rounded-xs block object-contain"
                />
              </div>

              <div className="flex items-center gap-3.5 mt-3.5">
                <span
                  className="text-[12px] text-dim font-mono cursor-pointer border border-border rounded-xs px-2 py-0.5 transition-[color,border-color] duration-150 hover:text-accent hover:border-accent"
                  title="Click to reuse this seed"
                  onClick={reuseSeed}
                >
                  seed {result.seed}
                </span>
                {elapsed !== null && (
                  <span className="text-[12px] text-muted">{elapsed.toFixed(1)}s</span>
                )}
                <button
                  className="bg-none border border-border rounded-xs text-dim cursor-pointer font-ui text-[12px] px-2.5 py-0.5 transition-[color,border-color] duration-150 hover:text-text hover:border-muted"
                  onClick={download}
                >
                  Download
                </button>
              </div>

              <div className="flex flex-col items-center gap-1.5 mt-3.5 w-full max-w-[480px]">
                <span className="text-[13px] text-dim italic text-center break-words">
                  &ldquo;{displayParams.prompt}&rdquo;
                </span>
                {displayParams.negative_prompt && (
                  <span className="text-[11px] text-muted text-center break-words">
                    Negative: {displayParams.negative_prompt}
                  </span>
                )}
                <span className="text-[11px] text-muted font-mono text-center">
                  Steps {displayParams.num_inference_steps} &middot; Guidance {displayParams.guidance_scale} &middot; {displayParams.width}&times;{displayParams.height} &middot; Seed {displayParams.seed}
                </span>
              </div>
            </>
          ) : (
            <div className="text-muted text-[13px] text-center m-auto">
              {loading ? (
                <div className="flex flex-col items-center gap-3.5 text-dim text-[13px]">
                  <div className="w-9 h-9 border-2 border-border border-t-accent rounded-full animate-spin" />
                  <p>Generating&hellip;</p>
                </div>
              ) : (
                <p>Your image will appear here</p>
              )}
            </div>
          )}

          {history.length > 0 && (
            <section className="w-full mt-7 pt-5 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-[13px] font-bold text-dim">History</h2>
                <button
                  className="bg-none border border-border rounded-xs text-muted cursor-pointer font-ui text-[11px] px-2 py-0.5 transition-[color,border-color] duration-150 hover:text-error hover:border-error"
                  onClick={clearHistory}
                >
                  Clear all
                </button>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1.5">
                {history.map((item, i) => (
                  <div
                    key={`${item.seed}-${i}`}
                    className="group relative shrink-0 w-20 bg-none border border-border rounded-xs cursor-pointer overflow-hidden transition-[border-color] duration-150 hover:border-accent"
                    onClick={() => viewFromHistory(item)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${item.image}`}
                      alt={item.prompt}
                      className="w-full block aspect-square object-cover"
                    />
                    <span className="block text-[10px] text-dim font-mono text-center px-0 pb-1 pt-0.5">
                      {item.seed}
                    </span>
                    <button
                      className="absolute top-[3px] right-[3px] w-[18px] h-[18px] flex items-center justify-center bg-black/60 border-none rounded-[3px] text-text cursor-pointer text-[13px] leading-none p-0 opacity-0 transition-opacity duration-150 hover:bg-[rgba(255,60,60,0.8)] group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEntry(i);
                      }}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {result && loading && (
            <div className="absolute inset-0 bg-[rgba(13,13,13,0.7)] flex items-center justify-center rounded-xs">
              <div className="w-9 h-9 border-2 border-border border-t-accent rounded-full animate-spin" />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
