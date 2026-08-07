"use client";

import { useEffect, useMemo, useState } from "react";
import workoutPlan from "../public/workouts.json";

type Exercise = {
  name: string;
  prescription: string;
  details: string;
  video: string;
  videoLabel: string;
};

type Workout = {
  title: string;
  shortTitle: string;
  focus: string;
  duration: string;
  kind: "lower" | "upper" | "cardio" | "recovery";
  note?: string;
  exercises: Exercise[];
};

type ScheduleEntry = {
  label: string;
  workout: keyof typeof workoutPlan.workouts;
};

type WeekdayKey = keyof typeof workoutPlan.schedule;

const plan = workoutPlan as {
  schedule: Record<WeekdayKey, ScheduleEntry>;
  workouts: Record<string, Workout>;
  intensity: { title: string; short: string; detail: string };
  tips: Array<{ title: string; text: string }>;
};

const weekdayKeys: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const calendarWeekdays = ["S", "M", "T", "W", "T", "F", "S"];
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function readCompleted(date: Date) {
  try {
    const saved = window.localStorage.getItem(`bloom-completed-${dateKey(date)}`);
    const parsed = saved ? (JSON.parse(saved) as unknown) : [];
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function getSchedule(date: Date) {
  return plan.schedule[weekdayKeys[date.getDay()]];
}

function getWorkout(date: Date) {
  return plan.workouts[getSchedule(date).workout];
}

function getMonthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function getYouTubeVideoId(videoUrl: string) {
  try {
    const parsed = new URL(videoUrl);
    const id = parsed.searchParams.get("v");
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return <span aria-hidden="true">{direction === "left" ? "‹" : "›"}</span>;
}

export function WorkoutApp() {
  const [today, setToday] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<Date | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [showInstallTip, setShowInstallTip] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const localToday = startOfDay(new Date());
      setToday(localToday);
      setSelectedDate(localToday);
      setVisibleMonth(new Date(localToday.getFullYear(), localToday.getMonth(), 1));
      setCompleted(readCompleted(localToday));

      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
      const dismissed = window.localStorage.getItem("bloom-install-tip-dismissed");
      setShowInstallTip(ios && !standalone && !dismissed);
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => {
        // The app still works online if a browser blocks service workers.
      });
    }

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const monthDates = useMemo(
    () => (visibleMonth ? getMonthGrid(visibleMonth) : []),
    [visibleMonth],
  );

  if (!today || !selectedDate || !visibleMonth) {
    return (
      <main className="loading-screen" aria-live="polite">
        <span className="loading-flower" aria-hidden="true">✿</span>
        <p>Getting your week ready…</p>
      </main>
    );
  }

  const schedule = getSchedule(selectedDate);
  const workout = getWorkout(selectedDate);
  const selectedIsToday = isSameDay(selectedDate, today);
  const progress = workout.exercises.length
    ? Math.round((completed.length / workout.exercises.length) * 100)
    : 0;

  function selectDate(date: Date) {
    const next = startOfDay(date);
    setSelectedDate(next);
    setCompleted(readCompleted(next));
    setPlayingVideo(null);
    if (
      next.getMonth() !== visibleMonth!.getMonth() ||
      next.getFullYear() !== visibleMonth!.getFullYear()
    ) {
      setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }

  function changeMonth(amount: number) {
    setVisibleMonth(
      new Date(visibleMonth!.getFullYear(), visibleMonth!.getMonth() + amount, 1),
    );
  }

  function toggleExercise(index: number) {
    const id = String(index);
    const next = completed.includes(id)
      ? completed.filter((item) => item !== id)
      : [...completed, id];
    setCompleted(next);
    window.localStorage.setItem(
      `bloom-completed-${dateKey(selectedDate!)}`,
      JSON.stringify(next),
    );
  }

  function dismissInstallTip() {
    window.localStorage.setItem("bloom-install-tip-dismissed", "true");
    setShowInstallTip(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#today" aria-label="Bloom and Move home">
          <span className="brand-mark" aria-hidden="true">✿</span>
          <span>Bloom &amp; Move</span>
        </a>
        <span className="tiny-note">strong looks sexy on you ♡</span>
      </header>

      {showInstallTip && (
        <aside className="install-tip" aria-label="Save to iPhone">
          <button
            className="tip-close"
            type="button"
            onClick={dismissInstallTip}
            aria-label="Dismiss install tip"
          >
            ×
          </button>
          <div className="tip-icon" aria-hidden="true">♡</div>
          <div>
            <strong>Keep me on your Home Screen</strong>
            <p>Tap Share <span aria-hidden="true">↥</span>, then “Add to Home Screen.”</p>
          </div>
        </aside>
      )}

      <section className={`hero hero-${workout.kind}`} id="today">
        <div className="hero-copy">
          <p className="eyebrow">
            {selectedIsToday ? "Today" : schedule.label} ·{" "}
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <h1>{workout.title}</h1>
          <p className="hero-focus">{workout.focus}</p>
          <div className="hero-meta">
            <span>{workout.duration}</span>
            <span>{workout.exercises.length ? `${workout.exercises.length} moves` : "Easy day"}</span>
          </div>
        </div>
        <div className="hero-bloom" aria-hidden="true">
          <span>✦</span>
        </div>
      </section>

      <aside className="love-note" aria-label="A little love note">
        <span aria-hidden="true">♡</span>
        <p>Getting stronger, sweatier, and ready to put that cardio to recreational use.</p>
      </aside>

      <section className="calendar-card" aria-labelledby="calendar-heading">
        <div className="section-heading calendar-heading">
          <div>
            <p className="section-kicker">Your rhythm</p>
            <h2 id="calendar-heading">
              {visibleMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>
          <div className="calendar-actions">
            {!selectedIsToday && (
              <button className="today-button" type="button" onClick={() => selectDate(today)}>
                Today
              </button>
            )}
            <button
              className="month-button"
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              <Chevron direction="left" />
            </button>
            <button
              className="month-button"
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              <Chevron direction="right" />
            </button>
          </div>
        </div>

        <div className="calendar-grid calendar-labels" aria-hidden="true">
          {calendarWeekdays.map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid" role="grid" aria-label="Workout calendar">
          {monthDates.map((date) => {
            const routine = getWorkout(date);
            const outsideMonth = date.getMonth() !== visibleMonth.getMonth();
            const selected = isSameDay(date, selectedDate);
            const current = isSameDay(date, today);
            return (
              <button
                key={dateKey(date)}
                className={`calendar-day day-${routine.kind}${selected ? " selected" : ""}${current ? " current" : ""}${outsideMonth ? " outside" : ""}`}
                type="button"
                onClick={() => selectDate(date)}
                role="gridcell"
                aria-selected={selected}
                aria-label={`${date.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}: ${routine.title}${current ? ", today" : ""}`}
              >
                <span>{date.getDate()}</span>
                <i aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div className="calendar-legend" aria-label="Calendar legend">
          <span><i className="legend-dot lower" />Lower</span>
          <span><i className="legend-dot upper" />Upper</span>
          <span><i className="legend-dot cardio" />Cardio</span>
          <span><i className="legend-dot recovery" />Rest</span>
        </div>
      </section>

      <section className="routine-section" aria-labelledby="routine-heading">
        <div className="section-heading routine-heading">
          <div>
            <p className="section-kicker">{schedule.label}</p>
            <h2 id="routine-heading">{workout.shortTitle}</h2>
          </div>
          {workout.exercises.length > 0 && (
            <div className="progress-pill" aria-label={`${progress}% complete`}>
              <span>{completed.length}/{workout.exercises.length}</span>
              done
            </div>
          )}
        </div>

        {workout.note && <p className="routine-note">{workout.note}</p>}

        {workout.exercises.length > 0 ? (
          <div className="exercise-list">
            {workout.exercises.map((exercise, index) => {
              const checked = completed.includes(String(index));
              const videoId = getYouTubeVideoId(exercise.video);
              const playerKey = `${dateKey(selectedDate)}-${index}`;
              const isPlaying = playingVideo === playerKey;
              const playerId = `exercise-video-${index}`;
              return (
                <article className={`exercise-card${checked ? " complete" : ""}`} key={exercise.name}>
                  <button
                    className="check-button"
                    type="button"
                    onClick={() => toggleExercise(index)}
                    aria-label={`${checked ? "Mark incomplete" : "Mark complete"}: ${exercise.name}`}
                    aria-pressed={checked}
                  >
                    <span aria-hidden="true">{checked ? "✓" : index + 1}</span>
                  </button>
                  <div className="exercise-copy">
                    <div className="exercise-title-row">
                      <h3>{exercise.name}</h3>
                      <span className="prescription">{exercise.prescription}</span>
                    </div>
                    <p>{exercise.details}</p>
                    {videoId && (
                      <button
                        className={`video-button${isPlaying ? " active" : ""}`}
                        type="button"
                        onClick={() => setPlayingVideo(isPlaying ? null : playerKey)}
                        aria-expanded={isPlaying}
                        aria-controls={playerId}
                      >
                        <span aria-hidden="true">{isPlaying ? "×" : "▶"}</span>
                        {isPlaying ? "Close video" : exercise.videoLabel}
                      </button>
                    )}
                  </div>
                  {videoId && isPlaying && (
                    <div className="video-player" id={playerId}>
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
                        title={`${exercise.name} form video`}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rest-card">
            <span className="rest-symbol" aria-hidden="true">☁</span>
            <h3>Rest is part of the plan.</h3>
            <p>Walk, stretch, or completely relax. You earned the soft day.</p>
          </div>
        )}
      </section>

      <aside className="rir-card">
        <div className="rir-number" aria-hidden="true">2</div>
        <div>
          <p className="section-kicker">{plan.intensity.title}</p>
          <h2>{plan.intensity.short}</h2>
          <p>{plan.intensity.detail}</p>
        </div>
      </aside>

      <section className="tips-section" aria-labelledby="tips-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Good to remember</p>
            <h2 id="tips-heading">Tiny gym tips</h2>
          </div>
        </div>
        <div className="tips-list">
          {plan.tips.map((tip) => (
            <details key={tip.title}>
              <summary>{tip.title}<span aria-hidden="true">＋</span></summary>
              <p>{tip.text}</p>
            </details>
          ))}
        </div>
      </section>

      <footer>
        <span aria-hidden="true">✿</span>
        <p>Strong today. Sexy always. Future family loading… ♡</p>
        <small>If anything hurts—not just feels challenging—stop and ask a trainer.</small>
      </footer>
    </main>
  );
}
