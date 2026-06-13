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
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium tracking-wider uppercase text-dim flex justify-between">
        {label}
        {hint && <span className="text-[10px] text-muted normal-case tracking-normal">{hint}</span>}
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
        className="flex items-center gap-[7px] bg-none border border-border rounded-sm text-dim cursor-pointer font-ui text-[13px] px-3 py-2 transition-[color,border-color] duration-150 hover:text-text hover:border-muted w-fit"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Settings"
      >
        <Settings size={18} />
        <span>Settings</span>
      </button>

      {open && (
        <div className="bg-surface border border-border rounded-sm flex flex-col gap-3.5 p-4">
          <Field label="Negative prompt" hint="optional">
            <input
              type="text"
              value={params.negative_prompt}
              onChange={set("negative_prompt")}
              placeholder="blurry, low quality, extra limbs…"
              className="bg-bg border border-border rounded-sm text-text font-ui text-[13px] px-2.5 py-[7px] w-full transition-[border-color] duration-150 focus:outline-none focus:border-accent placeholder:text-muted"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Steps" hint="1–4 for turbo">
              <input
                type="number"
                min={1}
                max={50}
                value={params.num_inference_steps}
                onChange={set("num_inference_steps")}
                className="bg-bg border border-border rounded-sm text-text font-ui text-[13px] px-2.5 py-[7px] w-full transition-[border-color] duration-150 focus:outline-none focus:border-accent placeholder:text-muted"
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
                className="bg-bg border border-border rounded-sm text-text font-ui text-[13px] px-2.5 py-[7px] w-full transition-[border-color] duration-150 focus:outline-none focus:border-accent placeholder:text-muted"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Width" hint="multiple of 8">
              <input
                type="number"
                min={256}
                max={2048}
                step={8}
                value={params.width}
                onChange={set("width")}
                className="bg-bg border border-border rounded-sm text-text font-ui text-[13px] px-2.5 py-[7px] w-full transition-[border-color] duration-150 focus:outline-none focus:border-accent placeholder:text-muted"
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
                className="bg-bg border border-border rounded-sm text-text font-ui text-[13px] px-2.5 py-[7px] w-full transition-[border-color] duration-150 focus:outline-none focus:border-accent placeholder:text-muted"
              />
            </Field>
          </div>

          <Field label="Seed" hint="leave empty for random">
            <input
              type="number"
              value={params.seed}
              onChange={set("seed")}
              placeholder="random"
              className="bg-bg border border-border rounded-sm text-text font-ui text-[13px] px-2.5 py-[7px] w-full transition-[border-color] duration-150 focus:outline-none focus:border-accent placeholder:text-muted"
            />
          </Field>
        </div>
      )}
    </>
  );
}
