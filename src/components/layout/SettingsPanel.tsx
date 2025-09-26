import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "../../game/defaults";
import { closeSettings, saveSettings } from "../../game/store/actions";
import { useStore } from "../../game/store/store";
import type {
  CameraMode,
  CameraType,
  Difficulty,
  Settings,
} from "../../game/store/types";
import Button from "../generic/Button";
import { Dialog } from "../generic/Dialog";
import { Label } from "../generic/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../generic/Select";
import { Checkbox } from "../generic/Checkbox";
import { cn } from "../../utils/cn";
import { ScrollArea, ScrollBar } from "../generic/ScrollArea";

export default function SettingsPanel({ isOpen }: { isOpen: boolean }) {
  const currentSettings = useStore((s) => s.settings);

  const [draft, setDraft] = useState<Settings>(() =>
    structuredClone(currentSettings)
  );

  useEffect(() => {
    if (isOpen) {
      setDraft(structuredClone(currentSettings));
    }
  }, [isOpen, currentSettings]);

  const toCustom = useCallback((next: Settings) => {
    if (next.difficulty !== "custom") {
      next = { ...next, difficulty: "custom" };
    }
    setDraft(next);
  }, []);

  const onDifficultyChange = (d: Difficulty) => {
    const preset = structuredClone(DEFAULT_SETTINGS[d]);
    setDraft(preset);
  };

  const onDimsChange = (key: "w" | "h" | "d", value: number) => {
    const v = Math.min(Math.max(2, value), 20);
    toCustom({ ...draft, dims: { ...draft.dims, [key]: v } });
  };

  const onTickChange = (value: number) => {
    toCustom({ ...draft, tickMs: Math.min(Math.max(0, value), 2000) });
  };

  const onToggle = (
    key: "wrap" | "showControlsInHead" | "showControlsInMinicube"
  ) => {
    toCustom({ ...draft, [key]: !draft[key] } as Settings);
  };

  const onCameraModeChange = (v: CameraMode) => {
    toCustom({ ...draft, cameraMode: v });
  };

  const onCameraTypeChange = (v: CameraType) => {
    toCustom({ ...draft, cameraType: v });
  };

  const onReset = () => {
    setDraft(structuredClone(DEFAULT_SETTINGS.easy));
  };

  const onSave = () => {
    saveSettings(draft);
    closeSettings();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => closeSettings()}
      className="fixed inset-0 grid place-items-center"
      backdropClassName="fixed inset-0 backdrop-blur-[2px]"
      contentClassName="w-[560px] max-w-[90vw] max-h-[95dvh] rounded-xs bg-background text-text p-0 shadow-xl border-1 border-accent flex flex-col font-start"
      ariaLabel="Settings"
    >
      <div className="px-6 py-4 my-4">
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>
      <ScrollArea className="flex-1 min-h-0 px-6 pb-4 text-sm" viewportClassName="max-h-[70dvh]">
        <section className="flex flex-nowrap gap-4 mb-6">
          <Label className="text-sm">Difficulty</Label>
          <Select
            value={draft.difficulty}
            onValueChange={(v) => onDifficultyChange(v as Difficulty)}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent className="font-start">
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="advanced" disabled className="opacity-70">
                Advanced (maybe sometime XD)
              </SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Grid */}
        <section className="flex flex-wrap gap-4 mb-6">
          <NumberField
            label="Width"
            value={draft.dims.w}
            onChange={(n) => onDimsChange("w", n)}
          />
          <NumberField
            label="Height"
            value={draft.dims.h}
            onChange={(n) => onDimsChange("h", n)}
          />
          <NumberField
            label="Depth"
            value={draft.dims.d}
            onChange={(n) => onDimsChange("d", n)}
          />
        </section>

        {/* Tick Rate */}
        <section className="flex flex-wrap gap-4 mb-6">
          <NumberField
            label="Tick (ms)"
            value={draft.tickMs}
            onChange={onTickChange}
            min={0}
            max={2000}
          />
        </section>

        {/* Toggles */}
        <section className="grid grid-cols-2 gap-4 mb-6">
          <CheckboxRow
            label="Wrap at edges"
            checked={draft.wrap}
            onChange={() => onToggle("wrap")}
          />
          <CheckboxRow
            label="Show controls on head (maybe sometime XD)"
            checked={draft.showControlsInHead}
            onChange={() => onToggle("showControlsInHead")}
            disabled
          />
          <CheckboxRow
            label="Show controls in mini cube"
            checked={draft.showControlsInMinicube}
            onChange={() => onToggle("showControlsInMinicube")}
          />
        </section>

        {/* Camera */}
        <section className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="text-sm">Camera mode</Label>
            <Select
              value={draft.cameraMode}
              onValueChange={(v) => onCameraModeChange(v as CameraMode)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Camera mode" />
              </SelectTrigger>
              <SelectContent className="font-start">
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="autoOrbit" disabled className="opacity-70">
                  Auto Orbit (maybe sometime XD)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Camera type</Label>
            <Select
              value={draft.cameraType}
              onValueChange={(v) => onCameraTypeChange(v as CameraType)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Camera type" />
              </SelectTrigger>
              <SelectContent className="font-start">
                <SelectItem value="perspective">Perspective</SelectItem>
                <SelectItem value="isometric">Isometric</SelectItem>
                <SelectItem value="2d" disabled className="opacity-70">
                  2D (maybe sometime XD)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Controls editor placeholder (will become its own component later) */}
        <section className="space-y-3 my-2">
          <h3 className="text-sm ">Controls</h3>
          <p className="text-sm opacity-80">
            Controls customization maybe sometime XD.
          </p>
          {/* Example of calling toCustom when you integrate ControlsEditor:
            <ControlsEditor
              value={draft.controls}
              onChange={(next) => toCustom({ ...draft, controls: next })}
            />
         */}
        </section>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
      <div className="flex justify-end gap-3 pt-2 pb-4 px-6">
        <Button className="duration-100 p-1" onClick={onReset}>Reset</Button>
        <Button className="duration-100 p-1" onClick={onSave}>Save</Button>
      </div>
    </Dialog>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <input
        type="number"
        className={[
          // layout
          "w-32 px-2 py-1 rounded",
          // colors
          "bg-transparent text-text placeholder:text-neutral/60",
          "border border-neutral/50",
          // focus states
          "outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:border-primary/80",
          // disabled / invalid
          "disabled:cursor-not-allowed disabled:opacity-60",
          "aria-invalid:border-secondary/60 aria-invalid:focus-visible:ring-secondary/30",
          // smooth
          "transition-[color,background,border,box-shadow]",
        ].join(" ")}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        `flex items-center gap-2 select-none cursor-pointer ${
          disabled ? "text-text/70" : ""
        }`
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled ?? false}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
