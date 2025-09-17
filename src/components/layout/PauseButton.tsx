import { togglePaused } from "../../game/store/actions";
import { useStore } from "../../game/store/store";
import { cn } from "../../utils/cn";




export default function PauseButton({...props}: React.HTMLAttributes<HTMLButtonElement>) {

    const paused = useStore((s) => s.ui.paused);

    return (<>
    <button aria-label="pause" {...props} className={cn(`${props.className} hover:text-primary cursor-pointer h-6 w-6 inline-grid place-items-center`)} onClick={togglePaused}>
        <div className="relative w-full h-full">
            <PauseIcon className={`absolute inset-0 ${paused ? "visible" : "invisible"}`} />
            <PlayIcon className={`absolute inset-0 ${paused ? "invisible" : "visible"}`} />
        </div>
    </button>
    </>)
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