import { useState } from "react";
import { Dialog } from "../generic/Dialog";

export default function Settings() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="cursor-pointer hover:text-red-500">Open</button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="fixed inset-0 grid place-items-center"
        backdropClassName="fixed inset-0 bg-black/50"
        contentClassName="w-[560px] max-w-[90vw] rounded-lg bg-white p-6 shadow-xl"
        ariaLabel="Generic dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">Your content here</h2>
          <button
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="rounded p-2 hover:bg-zinc-100"
          >
            ×
          </button>
        </div>
        <div className="mt-4">
          {/* your arbitrary children */}
          <p>Hello!</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setOpen(false)} className="btn">
            Close
          </button>
          <button className="btn-primary">Save</button>
        </div>
      </Dialog>
    </>
  );
}