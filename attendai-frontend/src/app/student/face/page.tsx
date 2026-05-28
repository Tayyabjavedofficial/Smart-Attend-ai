"use client";

import { useState } from "react";
import { ScanFace, CheckCircle2, Trash2, Loader2, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WebcamCapture } from "@/components/webcam/WebcamCapture";
import { useRegisterFace } from "@/lib/hooks";
import { ApiError } from "@/lib/api";

const MAX_SAMPLES = 3;

export default function StudentFacePage() {
  const [shots, setShots] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const registerFace = useRegisterFace();
  const error = registerFace.error as ApiError | undefined;

  const addShot = (dataUrl: string) => {
    setShots((s) => (s.length >= MAX_SAMPLES ? s : [...s, dataUrl]));
  };
  const removeShot = (i: number) => setShots((s) => s.filter((_, idx) => idx !== i));

  const register = () => {
    setDone(false);
    registerFace.mutate(shots, { onSuccess: () => setDone(true) });
  };

  return (
    <>
      <PageHeader
        title="Face Profile"
        subtitle="Register your face so the system can verify you when you mark attendance."
        icon={ScanFace}
        crumbs={[{ label: "Student", href: "/student" }, { label: "Face Profile" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 items-start">
        <Card>
          <CardHeader
            title={`Capture your face (${shots.length}/${MAX_SAMPLES})`}
            subtitle="Look straight at the camera in good lighting. Add up to 3 shots for a better profile."
          />
          {shots.length < MAX_SAMPLES ? (
            <WebcamCapture onCapture={addShot} captureLabel={`Capture shot ${shots.length + 1}`} />
          ) : (
            <div className="aspect-[4/3] rounded-2xl bg-brand-50/60 ring-1 ring-brand-100 grid place-items-center text-center px-6">
              <div>
                <CheckCircle2 className="size-8 text-brand-600 mx-auto mb-2" />
                <p className="text-sm text-ink-700">All {MAX_SAMPLES} shots captured.</p>
                <p className="text-xs text-ink-400 mt-1">Remove one below if you want to retake it.</p>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your samples" subtitle="These are sent securely to register your profile." />
            {shots.length === 0 ? (
              <p className="text-sm text-ink-400 py-6 text-center">No samples captured yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {shots.map((src, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Sample ${i + 1}`} className="aspect-square w-full object-cover rounded-xl ring-1 ring-ink-200" />
                    <button
                      type="button"
                      onClick={() => removeShot(i)}
                      className="absolute top-1 right-1 size-6 rounded-lg bg-ink-900/70 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove sample"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {done ? (
              <div className="mt-4 p-3 rounded-xl bg-brand-50/70 ring-1 ring-brand-100 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-brand-600" />
                <span className="text-sm text-brand-800">Face profile registered. You can now verify during attendance.</span>
              </div>
            ) : null}

            {error ? <div className="mt-4"><Badge tone="danger">{error.message}</Badge></div> : null}

            <Button
              className="w-full mt-4"
              disabled={shots.length === 0 || registerFace.isPending}
              onClick={register}
            >
              {registerFace.isPending ? <Loader2 className="size-4 animate-spin" /> : <ScanFace className="size-4" />}
              {registerFace.isPending ? "Registering…" : "Register face profile"}
            </Button>
          </Card>

          <Card>
            <div className="flex items-start gap-2.5 text-xs text-ink-500">
              <Info className="size-4 text-brand-600 mt-0.5 shrink-0" />
              <p>Your photos are used only to recognise you during attendance. You can re-register anytime to update your profile.</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
