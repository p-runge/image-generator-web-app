"use client";

import { useState, useCallback } from "react";
import SettingsPanel, { GenerateParams } from "@/components/SettingsPanel";

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
  const [history, setHistory]   = useState<Result[]>([]);
  const [historyPrompts, setHistoryPrompts] = useState<Record<number, string>>({});

  async function generate() {
    if (!params.prompt.trim()) return;

    setLoading(true);
    setError(null);
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
      setHistory((prev) => [{ image: data.image, seed: data.seed }, ...prev]);
      setHistoryPrompts((prev) => ({ ...prev, [data.seed]: params.prompt }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reuseSeed() {
    if (result) setParams((p) => ({ ...p, seed: String(result.seed) }));
  }

  const viewFromHistory = useCallback((item: Result) => {
    setResult(item);
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

  return (
    <main>
      <header>
        <h1>image<span>gen</span></h1>
      </header>

      <div className="layout">
        <section className="controls">
          <div className="prompt-area">
            <textarea
              className="prompt-input"
              placeholder="Describe the image…"
              value={params.prompt}
              onChange={(e) => setParams((p) => ({ ...p, prompt: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
              }}
              rows={4}
            />
            <span className="prompt-hint">⌘ Enter to generate</span>
          </div>

          <SettingsPanel params={params} onChange={setParams} />

          <button
            className="generate-btn"
            onClick={generate}
            disabled={!canSubmit}
          >
            {loading ? <span className="spinner" /> : "Generate"}
          </button>

          {error && <p className="error-msg">{error}</p>}
        </section>

        <section className="output">
          {result ? (
            <>
              <div className="image-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${result.image}`}
                  alt={params.prompt}
                />
              </div>
              <div className="image-meta">
                <span className="meta-seed" title="Click to reuse this seed" onClick={reuseSeed}>
                  seed {result.seed}
                </span>
                {elapsed !== null && (
                  <span className="meta-time">{elapsed.toFixed(1)}s</span>
                )}
                <button className="download-btn" onClick={download}>
                  Download
                </button>
              </div>

              {history.length > 0 && (
                <section className="history">
                  <h2 className="history-title">History</h2>
                  <div className="history-grid">
                    {history.map((item, i) => (
                      <button
                        key={`${item.seed}-${i}`}
                        className="history-item"
                        onClick={() => viewFromHistory(item)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${item.image}`}
                          alt={historyPrompts[item.seed] ?? `seed ${item.seed}`}
                        />
                        <span className="history-seed">{item.seed}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="output-empty">
              {loading ? (
                <div className="generating-state">
                  <div className="big-spinner" />
                  <p>Generating…</p>
                </div>
              ) : (
                <p>Your image will appear here</p>
              )}
            </div>
          )}

          {result && loading && (
            <div className="output-overlay">
              <div className="big-spinner" />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
