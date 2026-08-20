"use client";

import { useEffect, useState } from "react";
import workoutPlan from "../public/workouts.json";
import {
  getProgressionStage,
  isProgressionResetRound,
} from "../lib/workout-progression.mjs";

type Exercise = {
  name: string;
  prescription?: string;
  prescriptions?: [string, string, string];
  resetCue?: string;
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

type WorkoutMode = "gym" | "home";

type RotationEntry = {
  label: string;
  workout: keyof typeof workoutPlan.workouts;
};

const plan = workoutPlan as {
  rotation: RotationEntry[];
  workouts: Record<string, Workout>;
  homeWorkouts: Record<string, Workout>;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const workoutModeStorageKey = "bloom-workout-mode";
const rotationPositionStorageKey = "bloom-rotation-position-v1";
const messageIndexStorageKey = "bloom-message-index";

const dailyMessages = [
  {
    loveNote: "Getting stronger, sweatier, and ready to put that cardio to recreational use.",
    footer: "Working out now so you can have my babies later ♡",
  },
  {
    loveNote: "Getting strong so I can put a baby in you someday",
    footer: "Every rep makes you even harder to keep my hands off. ♡",
  },
  {
    loveNote: "Save those sweaty panties for me—I want to smell how hard you worked.",
    footer: "Strong legs, filthy thoughts, perfect combination. ♡",
  },
  {
    loveNote: "Sweat now. I’ll help you cool down later.",
    footer: "Training for the kind of cardio we actually enjoy. ♡",
  },
  {
    loveNote: "Build that stamina—I’ve got plans for it.",
    footer: "Get strong, stay sexy, come home to me. ♡",
  },
  {
    loveNote: "I love watching you get hot and out of breath.",
    footer: "Sweat looks ridiculously good on you. ♡",
  },
  {
    loveNote: "One more rep, then come collect your reward.",
    footer: "Future mama in training—lucky me. ♡",
  },
  {
    loveNote: "Tonight you have 3 sets of bouncing on it crazy style.",
    footer: "Your favorite workout starts after this one. ♡",
  },
] as const;

function getPseudorandomMessageIndex() {
  const randomIndex = (length: number) => Math.floor(Math.random() * length);

  try {
    const previousIndex = Number(window.localStorage.getItem(messageIndexStorageKey));
    const hasPreviousIndex =
      Number.isSafeInteger(previousIndex) &&
      previousIndex >= 0 &&
      previousIndex < dailyMessages.length;
    const nextIndex = hasPreviousIndex && dailyMessages.length > 1
      ? (() => {
          const candidate = randomIndex(dailyMessages.length - 1);
          return candidate >= previousIndex ? candidate + 1 : candidate;
        })()
      : randomIndex(dailyMessages.length);

    window.localStorage.setItem(messageIndexStorageKey, String(nextIndex));
    return nextIndex;
  } catch {
    return randomIndex(dailyMessages.length);
  }
}

function exerciseStorageKey(position: number, mode: WorkoutMode) {
  return `bloom-rolling-completed-${position}-${mode}`;
}

function readCompleted(position: number, mode: WorkoutMode) {
  try {
    const saved = window.localStorage.getItem(exerciseStorageKey(position, mode));
    const parsed = saved ? (JSON.parse(saved) as unknown) : [];
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function readWorkoutMode(): WorkoutMode {
  return window.localStorage.getItem(workoutModeStorageKey) === "home"
    ? "home"
    : "gym";
}

function readRotationPosition() {
  const saved = Number(window.localStorage.getItem(rotationPositionStorageKey));
  return Number.isSafeInteger(saved) && saved >= 0 ? saved : 0;
}

function getWorkout(workoutKey: RotationEntry["workout"], mode: WorkoutMode) {
  const workouts = mode === "home" ? plan.homeWorkouts : plan.workouts;
  return workouts[workoutKey];
}

function getExercisePrescription(exercise: Exercise, rotationRound: number) {
  if (exercise.prescriptions) {
    return exercise.prescriptions[
      getProgressionStage(rotationRound, exercise.prescriptions.length)
    ];
  }

  return exercise.prescription ?? "";
}

function isProgressionReset(exercise: Exercise, rotationRound: number) {
  return Boolean(
    exercise.prescriptions &&
    exercise.resetCue &&
    isProgressionResetRound(rotationRound, exercise.prescriptions.length),
  );
}

function getYouTubeVideoId(videoUrl?: string) {
  if (!videoUrl) return null;
  try {
    const parsed = new URL(videoUrl);
    const id = parsed.searchParams.get("v");
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function WorkoutApp() {
  const [messageIndex, setMessageIndex] = useState<number | null>(null);
  const [rotationPosition, setRotationPosition] = useState(0);
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>("gym");
  const [completed, setCompleted] = useState<string[]>([]);
  const [showInstallTip, setShowInstallTip] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMessageIndex(getPseudorandomMessageIndex());
      const savedMode = readWorkoutMode();
      const savedPosition = readRotationPosition();
      setWorkoutMode(savedMode);
      setRotationPosition(savedPosition);
      setCompleted(readCompleted(savedPosition, savedMode));

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

  if (messageIndex === null) {
    return (
      <main className="loading-screen" aria-live="polite">
        <span className="loading-flower" aria-hidden="true">✿</span>
        <p>Getting your next workout ready…</p>
      </main>
    );
  }

  const rotationIndex = rotationPosition % plan.rotation.length;
  const rotationRound = Math.floor(rotationPosition / plan.rotation.length) + 1;
  const currentStep = plan.rotation[rotationIndex];
  const nextStep = plan.rotation[(rotationIndex + 1) % plan.rotation.length];
  const workout = getWorkout(currentStep.workout, workoutMode);
  const nextWorkout = getWorkout(nextStep.workout, workoutMode);
  const dailyMessage = dailyMessages[messageIndex];
  const progress = workout.exercises.length
    ? Math.round((completed.length / workout.exercises.length) * 100)
    : 0;

  function changeWorkoutMode(mode: WorkoutMode) {
    setWorkoutMode(mode);
    setCompleted(readCompleted(rotationPosition, mode));
    setPlayingVideo(null);
    window.localStorage.setItem(workoutModeStorageKey, mode);
  }

  function toggleExercise(index: number) {
    const id = String(index);
    const next = completed.includes(id)
      ? completed.filter((item) => item !== id)
      : [...completed, id];
    setCompleted(next);
    window.localStorage.setItem(
      exerciseStorageKey(rotationPosition, workoutMode),
      JSON.stringify(next),
    );
  }

  function finishWorkout() {
    const nextPosition = rotationPosition + 1;
    setRotationPosition(nextPosition);
    setCompleted(readCompleted(nextPosition, workoutMode));
    setPlayingVideo(null);
    setStatusMessage(`${workout.shortTitle} complete. ${nextWorkout.shortTitle} is up next.`);
    window.localStorage.setItem(rotationPositionStorageKey, String(nextPosition));
  }

  function goBackOneWorkout() {
    if (rotationPosition === 0) return;
    const previousPosition = rotationPosition - 1;
    setRotationPosition(previousPosition);
    setCompleted(readCompleted(previousPosition, workoutMode));
    setPlayingVideo(null);
    setStatusMessage("Moved back one workout.");
    window.localStorage.setItem(rotationPositionStorageKey, String(previousPosition));
  }

  function dismissInstallTip() {
    window.localStorage.setItem("bloom-install-tip-dismissed", "true");
    setShowInstallTip(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#today" aria-label="Erie’s Workout home">
          <span className="brand-mark" aria-hidden="true">✿</span>
          <span>Erie’s Workout</span>
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

      <section className="plan-switcher" aria-labelledby="plan-switcher-label">
        <div>
          <p className="section-kicker">Pick your place</p>
          <h2 id="plan-switcher-label">Where are we moving?</h2>
        </div>
        <div className="segmented-control" role="group" aria-label="Workout location">
          <button
            className={workoutMode === "gym" ? "active" : ""}
            type="button"
            onClick={() => changeWorkoutMode("gym")}
            aria-pressed={workoutMode === "gym"}
          >
            Gym
          </button>
          <button
            className={workoutMode === "home" ? "active" : ""}
            type="button"
            onClick={() => changeWorkoutMode("home")}
            aria-pressed={workoutMode === "home"}
          >
            At home
          </button>
        </div>
      </section>

      <section className={`hero hero-${workout.kind}`} id="today">
        <div className="hero-copy">
          <p className="eyebrow">
            Up next · {currentStep.label}
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
        <span className="love-note-heart" aria-hidden="true">♡</span>
        <p>{dailyMessage.loveNote}</p>
      </aside>

      <p className="status-announcement" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      <section className="rotation-card" aria-labelledby="rotation-heading">
        <div className="section-heading rotation-heading">
          <div>
            <p className="section-kicker">Your rolling plan</p>
            <h2 id="rotation-heading">Workout {rotationIndex + 1} of {plan.rotation.length}</h2>
          </div>
          <span className="round-pill">Round {rotationRound}</span>
        </div>

        <p className="rotation-explainer">
          No dates and no missed days. This workout stays here until you finish it,
          then the next one rolls in.
        </p>

        <ol className="rotation-track" aria-label="Five-workout rotation">
          {plan.rotation.map((step, index) => {
            const stepWorkout = getWorkout(step.workout, workoutMode);
            const state = index < rotationIndex
              ? "complete"
              : index === rotationIndex
                ? "current"
                : "upcoming";
            return (
              <li
                className={`rotation-step ${state} step-${stepWorkout.kind}`}
                key={`${step.label}-${index}`}
                aria-current={state === "current" ? "step" : undefined}
              >
                <span className="rotation-dot" aria-hidden="true">
                  {state === "complete" ? "✓" : index + 1}
                </span>
                <span className="rotation-step-copy">
                  <strong>{stepWorkout.shortTitle}</strong>
                  <small>{state === "current" ? "Now" : state === "complete" ? "Done" : "Later"}</small>
                </span>
              </li>
            );
          })}
        </ol>

        {rotationPosition > 0 && (
          <button className="back-workout-button" type="button" onClick={goBackOneWorkout}>
            ← Go back one workout
          </button>
        )}
      </section>

      <section className="routine-section" aria-labelledby="routine-heading">
        <div className="section-heading routine-heading">
          <div>
            <p className="section-kicker">
              {currentStep.label} · {workoutMode === "home" ? "At home" : "Gym"}
            </p>
            <h2 id="routine-heading">{workout.shortTitle}</h2>
          </div>
          {workout.exercises.length > 0 && (
            <div className="progress-pill" aria-label={`${progress}% complete`}>
              <span>{completed.length}/{workout.exercises.length}</span>
              done
            </div>
          )}
        </div>

        <button className="finish-workout-button" type="button" onClick={finishWorkout}>
          <span className="finish-workout-icon" aria-hidden="true">✓</span>
          <span className="finish-workout-copy">
            <strong>Finished this workout</strong>
            <small>Tap once and move on to {nextWorkout.shortTitle.toLowerCase()}.</small>
          </span>
          <span className="finish-workout-action" aria-hidden="true">Next →</span>
        </button>

        {workout.note && (
          <section className="routine-guidance" aria-label="Before you start">
            <h3>Before you start</h3>
            <p>{workout.note}</p>
          </section>
        )}

        {workout.exercises.length > 0 ? (
          <div className="exercise-list">
            {workout.exercises.map((exercise, index) => {
              const checked = completed.includes(String(index));
              const prescription = getExercisePrescription(exercise, rotationRound);
              const showResetCue = isProgressionReset(exercise, rotationRound);
              const videoId = getYouTubeVideoId(exercise.video);
              const playerKey = `${rotationPosition}-${workoutMode}-${index}`;
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
                      <span className="prescription">{prescription}</span>
                    </div>
                    <p>{exercise.details}</p>
                    {showResetCue && (
                      <p className="progression-reset">
                        <strong>Level up:</strong> {exercise.resetCue}
                      </p>
                    )}
                    {videoId && !isPlaying && (
                      <button
                        className="video-button"
                        type="button"
                        onClick={() => setPlayingVideo(playerKey)}
                        aria-expanded="false"
                        aria-controls={playerId}
                      >
                        <span aria-hidden="true">▶</span>
                        {exercise.videoLabel}
                      </button>
                    )}
                  </div>
                  {videoId && isPlaying && (
                    <div className="video-panel" id={playerId}>
                      <div className="video-toolbar">
                        <span>Form video</span>
                        <button
                          className="video-close-button"
                          type="button"
                          onClick={() => setPlayingVideo(null)}
                          aria-label={`Close ${exercise.name} form video`}
                          aria-controls={playerId}
                        >
                          <span aria-hidden="true">×</span>
                          Close
                        </button>
                      </div>
                      <div className="video-player">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
                          title={`${exercise.name} form video`}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
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

      <footer>
        <span aria-hidden="true">✿</span>
        <p>{dailyMessage.footer}</p>
        <small>If anything hurts—not just feels challenging—stop and ask a trainer.</small>
      </footer>
    </main>
  );
}
