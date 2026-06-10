"use client";

import { Settings } from "lucide-react";
import { useState } from "react";

export interface GenerateParams {
  prompt: string;
  negative_prompt: string;
  num_inference_steps: number;
  guidance_scale: number;
  width: number;
  height: number;
  seed: string;
}

interface Props {
  params: GenerateParams;
  onChange: (params: GenerateParams) => void;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function SettingsPanel({ params, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const set = (key: keyof GenerateParams) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChange({ ...params, [key]: e.target.value });

  return (
    <>
      <button
        className="settings-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Settings"
      >
        <Settings size={18} />
        <span>Settings</span>
      </button>

      {open && (
        <div className="settings-panel">
          <Field label="Negative prompt" hint="optional">
            <input
              type="text"
              value={params.negative_prompt}
              onChange={set("negative_prompt")}
              placeholder="blurry, low quality, extra limbs…"
            />
          </Field>

          <div className="field-row">
            <Field label="Steps" hint="1–4 for turbo">
              <input
                type="number"
                min={1}
                max={50}
                value={params.num_inference_steps}
                onChange={set("num_inference_steps")}
              />
            </Field>
            <Field label="Guidance" hint="0 for turbo">
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={params.guidance_scale}
                onChange={set("guidance_scale")}
              />
            </Field>
          </div>

          <div className="field-row">
            <Field label="Width" hint="multiple of 8">
              <input
                type="number"
                min={256}
                max={2048}
                step={8}
                value={params.width}
                onChange={set("width")}
              />
            </Field>
            <Field label="Height" hint="multiple of 8">
              <input
                type="number"
                min={256}
                max={2048}
                step={8}
                value={params.height}
                onChange={set("height")}
              />
            </Field>
          </div>

          <Field label="Seed" hint="leave empty for random">
            <input
              type="number"
              value={params.seed}
              onChange={set("seed")}
              placeholder="random"
            />
          </Field>
        </div>
      )}
    </>
  );
}
