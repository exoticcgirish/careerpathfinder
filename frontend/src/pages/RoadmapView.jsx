import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Target,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { roadmaps } from "../services/api.js";

export default function RoadmapView() {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(() => new Set());

  useEffect(() => {
    let alive = true;
    roadmaps
      .get(id)
      .then((r) => alive && setRoadmap(r))
      .catch((e) => alive && setError(e.response?.data?.detail || "Failed to load"));
    return () => {
      alive = false;
    };
  }, [id]);

  const toggle = (i) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-red-600">{error}</p>
        <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
          Back to assessment
        </Link>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-slate-500">
        Loading your roadmap…
      </div>
    );
  }

  const { target_role, skill_gap, milestones } = roadmap.structured_json;
  const progress = milestones.length ? (completed.size / milestones.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> New assessment
      </Link>

      <Card className="mb-6">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-600" />
              {target_role}
            </span>
          }
          subtitle={`${milestones.length} milestones · ${completed.size} completed`}
        />
        <CardBody>
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Skill gap to close</h3>
            <div className="flex flex-wrap gap-2">
              {skill_gap.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="relative">
        <div
          className="absolute left-4 top-2 bottom-2 w-px bg-slate-200"
          aria-hidden
        />
        <ol className="space-y-6">
          {milestones.map((m, i) => {
            const done = completed.has(i);
            return (
              <li key={i} className="relative pl-12">
                <button
                  onClick={() => toggle(i)}
                  className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white shadow"
                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                >
                  {done ? (
                    <CheckCircle2 className="h-7 w-7 text-brand-600" />
                  ) : (
                    <Circle className="h-7 w-7 text-slate-300" />
                  )}
                </button>

                <Card
                  className={`transition ${done ? "opacity-70" : ""}`}
                >
                  <CardBody>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        Phase {i + 1}: {m.phase_title}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        <Clock className="h-3 w-3" /> {m.duration}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Core topics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {m.core_topics.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {m.free_resources?.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <BookOpen className="h-3 w-3" /> Free resources
                        </h4>
                        <ul className="space-y-2">
                          {m.free_resources.map((r, j) => (
                            <li key={j}>
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group inline-flex items-center gap-2 text-sm text-slate-700 hover:text-brand-700"
                              >
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                                  {r.type}
                                </span>
                                <span className="underline-offset-2 group-hover:underline">
                                  {r.title}
                                </span>
                                <ExternalLink className="h-3 w-3 opacity-60" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-8 text-center">
        <Link to="/">
          <Button variant="secondary">Start another assessment</Button>
        </Link>
      </div>
    </div>
  );
}
