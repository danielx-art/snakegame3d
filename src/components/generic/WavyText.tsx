import React from "react";
import { cn } from "../../utils/cn";

type NamedEasing =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";

// Allow custom timing functions via template literal types.
type CubicBezier =
  `cubic-bezier(${number}, ${number}, ${number}, ${number})`;
type Steps =
  | `steps(${number})`
  | `steps(${number}, start)`
  | `steps(${number}, end)`;

type TimingFunction = NamedEasing | CubicBezier | Steps;

function isValidTimingFunction(easing: string): easing is TimingFunction {
  if (
    easing === "linear" ||
    easing === "ease" ||
    easing === "ease-in" ||
    easing === "ease-out" ||
    easing === "ease-in-out"
  ) {
    return true;
  }
  // Simple checks for cubic-bezier(...) and steps(...)
  const cubic = /^cubic-bezier\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)$/i;
  const steps =
    /^steps\(\s*(\d+)\s*(?:,\s*(start|end)\s*)?\)$/i;

  return cubic.test(easing) || steps.test(easing);
}

type WavyTextProps = {
  text: string;
  className?: string;
  duration?: number;
  easing?: TimingFunction;
  delayPerCharMs?: number;
  amplitudeEm?: number;
};

const WavyText: React.FC<WavyTextProps> = ({
  text,
  className,
  duration = 2000,
  easing = "ease-in-out",
  delayPerCharMs,
  amplitudeEm = 0.35,
}) => {
  const chars = Array.from(text);

  const delayStepMs =
    delayPerCharMs ?? Math.max(chars.length, Math.floor(duration / chars.length));


  const easingSafe: TimingFunction =
    isValidTimingFunction(easing) ? easing : "ease-in-out";

  const containerStyle: React.CSSProperties = {
    ["--wave-duration" as never]: `${duration}ms`,
    ["--wave-easing" as never]: easingSafe,
    ["--wave-amplitude" as never]: `${amplitudeEm}em`,
    ["--wave-delay-step" as never]: `${delayStepMs}ms`,
  };

  return (
    <span
      className={cn("inline-block align-baseline", className)}
      style={containerStyle}
      aria-label={text}
    >
      <style>
        {`
          @keyframes wavyText-bob {
            0% { transform: translateY(0); }
            25% { transform: translateY(calc(-1 * var(--wave-amplitude))); }
            50% { transform: translateY(0); }
            75% { transform: translateY(var(--wave-amplitude)); }
            100% { transform: translateY(0); }
          }
          .wavy-char {
            display: inline-block;
            will-change: transform;
            animation-name: wavyText-bob;
            animation-duration: var(--wave-duration);
            animation-timing-function: var(--wave-easing);
            animation-iteration-count: infinite;
          }
        `}
      </style>

      {chars.map((ch, i) => {
        const display = ch === " " ? "\u00A0" : ch;
        const spanStyle: React.CSSProperties = {
          // Negative base keeps the wave "already in motion"
          animationDelay: `calc(-1 * var(--wave-duration) + ${i} * var(--wave-delay-step))`,
        };
        return (
          <span
            key={`${ch}-${i}`}
            className="wavy-char"
            style={spanStyle}
            aria-hidden="true"
          >
            {display}
          </span>
        );
      })}
    </span>
  );
};

export default WavyText;