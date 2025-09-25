import { togglePaused } from "../../game/store/actions";
import { useStore } from "../../game/store/store";
import Button from "../generic/Button";

export default function PauseButton() {
  const paused = useStore((s) => s.ui.paused);

  return (
    <Button aria-label="pause" onClick={togglePaused} className="relative h-6 w-6 ">
      <PauseIcon
        className={`size-6 ${paused ? "visible" : "invisible"}`}
      />
      <PlayIcon
        className={`absolute inset-0 size-6 ${paused ? "invisible" : "visible"}`}
      />
    </Button>
  );
}

function PauseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 5 L10 5 L10 19 L6 19 Z" />
      <path d="M14 5 L18 5 L18 19 L14 19 Z" />
    </svg>
  );
}

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      <path d="M7 6 L7 18 L18 12 Z" />
    </svg>
  );
}
