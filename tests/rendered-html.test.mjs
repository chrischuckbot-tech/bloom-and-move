import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  getProgressionStage,
  isProgressionResetRound,
} from "../lib/workout-progression.mjs";

const root = new URL("../", import.meta.url);

test("cycles exercise prescriptions every three rotation rounds", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7].map((round) => getProgressionStage(round)),
    [0, 1, 2, 0, 1, 2, 0],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7].filter((round) => isProgressionResetRound(round)),
    [4, 7],
  );
});

test("exports a GitHub Pages-ready workout app", async () => {
  const [html, manifest, workouts, serviceWorker] = await Promise.all([
    readFile(new URL("dist/client/index.html", root), "utf8"),
    readFile(new URL("dist/client/manifest.webmanifest", root), "utf8"),
    readFile(new URL("dist/client/workouts.json", root), "utf8"),
    readFile(new URL("dist/client/sw.js", root), "utf8"),
  ]);

  assert.match(html, /<title>Erie’s Workout<\/title>/i);
  assert.match(html, /manifest\.webmanifest/i);
  assert.match(html, /og\.png/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    assert.match(html, new RegExp(`${process.env.NEXT_PUBLIC_BASE_PATH}/assets/`));
    assert.doesNotMatch(html, /(?:href=|import\()["']\/assets\//);
  }

  const parsedManifest = JSON.parse(manifest);
  assert.equal(parsedManifest.name, "Erie’s Workout");
  assert.equal(parsedManifest.display, "standalone");
  assert.equal(parsedManifest.start_url, "./");
  assert.equal(parsedManifest.icons.length, 2);

  const parsedWorkouts = JSON.parse(workouts);
  assert.deepEqual(
    parsedWorkouts.rotation.map((entry) => entry.workout),
    ["lower", "upper", "cardio", "lower", "upper"],
  );
  assert.equal(parsedWorkouts.workouts.cardio.title, "30-Minute Treadmill Run/Jog");
  assert.equal(parsedWorkouts.workouts.cardio.duration, "30 min");
  assert.equal(parsedWorkouts.workouts.cardio.exercises.length, 1);
  assert.equal(parsedWorkouts.workouts.cardio.exercises[0].name, "Treadmill Run/Jog");
  assert.equal(
    parsedWorkouts.workouts.cardio.exercises[0].video,
    "https://www.youtube.com/watch?v=kHD1NaSdwzI",
  );
  assert.equal(parsedWorkouts.workouts.lower.exercises.length, 8);
  assert.equal(parsedWorkouts.workouts.upper.exercises.length, 7);
  assert.match(parsedWorkouts.workouts.upper.note, /2 reps in reserve \(RIR\)/i);
  assert.equal(parsedWorkouts.homeWorkouts.lower.title, "At-Home Legs + Cardio");
  assert.equal(parsedWorkouts.homeWorkouts.lower.exercises.length, 8);
  assert.equal(parsedWorkouts.homeWorkouts.upper.exercises.length, 7);
  assert.equal(parsedWorkouts.homeWorkouts.cardio.duration, "About 30 min");
  assert.equal(parsedWorkouts.homeWorkouts.cardio.exercises.length, 5);
  assert.match(parsedWorkouts.homeWorkouts.lower.note, /no equipment needed/i);
  assert.ok(
    Object.values(parsedWorkouts.homeWorkouts).every(
      (workout) =>
        workout.exercises.length === 0 ||
        workout.exercises[0].name === "Jumping Jack Warm-Up",
    ),
  );
  assert.equal(
    JSON.stringify(parsedWorkouts.homeWorkouts).match(/outdoor|jog around the block/gi),
    null,
  );
  assert.ok(
    Object.values(parsedWorkouts.homeWorkouts)
      .flatMap((workout) => workout.exercises)
      .every(
        (exercise) =>
          /^https:\/\/www\.youtube\.com\/watch\?v=/.test(exercise.video) &&
          exercise.videoLabel.length > 0,
      ),
  );
  assert.ok(
    parsedWorkouts.homeWorkouts.cardio.exercises.some(
      (exercise) =>
        exercise.name === "Burpee (No Push-Up)" &&
        exercise.video === "https://www.youtube.com/watch?v=CqJ947Bj2Zg",
    ),
  );
  assert.equal(
    parsedWorkouts.homeWorkouts.cardio.exercises.find(
      (exercise) => exercise.name === "Jump Squats",
    ).video,
    "https://www.youtube.com/watch?v=BRfxI2Es2lE",
  );
  assert.equal(
    parsedWorkouts.homeWorkouts.cardio.exercises.find(
      (exercise) => exercise.name === "Plank Shoulder Tap",
    ).video,
    "https://www.youtube.com/watch?v=QOCn3_iOAro",
  );
  assert.ok(
    parsedWorkouts.homeWorkouts.lower.exercises.some(
      (exercise) => exercise.name === "Bodyweight Squat",
    ),
  );
  assert.ok(
    parsedWorkouts.homeWorkouts.lower.exercises.some(
      (exercise) => exercise.name === "Reverse Lunge",
    ),
  );
  assert.deepEqual(
    parsedWorkouts.homeWorkouts.lower.exercises.find(
      (exercise) => exercise.name === "Single-Leg Glute Bridge",
    ).prescriptions,
    ["3 × 8 each side", "3 × 10 each side", "3 × 12 each side"],
  );
  assert.equal(
    parsedWorkouts.homeWorkouts.lower.exercises.some(
      (exercise) => /supported reverse lunge/i.test(exercise.name),
    ),
    false,
  );
  assert.ok(
    parsedWorkouts.homeWorkouts.upper.exercises.some(
      (exercise) => /back/i.test(exercise.name),
    ),
  );
  assert.equal(
    parsedWorkouts.homeWorkouts.upper.exercises.find(
      (exercise) => exercise.name === "Floor Lat Slides",
    ).video,
    "https://www.youtube.com/watch?v=jtskZxMzZL8",
  );
  assert.equal(
    parsedWorkouts.homeWorkouts.upper.exercises.find(
      (exercise) => exercise.name === "High Plank Shoulder Tap",
    ).video,
    "https://www.youtube.com/watch?v=QOCn3_iOAro",
  );
  assert.equal(
    parsedWorkouts.homeWorkouts.upper.exercises.some(
      (exercise) => /kneeling shoulder tap/i.test(exercise.name),
    ),
    false,
  );
  assert.deepEqual(
    parsedWorkouts.homeWorkouts.upper.exercises.find(
      (exercise) => exercise.name === "Forearm Plank",
    ).prescriptions,
    ["2 × 20 sec", "2 × 30 sec", "2 × 40 sec"],
  );
  assert.equal(
    Object.values(parsedWorkouts.homeWorkouts)
      .flatMap((workout) => workout.exercises)
      .some((exercise) => /shadowbox/i.test(exercise.name)),
    false,
  );
  assert.equal("intensity" in parsedWorkouts, false);
  assert.equal("tips" in parsedWorkouts, false);

  const everyExercise = [parsedWorkouts.workouts, parsedWorkouts.homeWorkouts]
    .flatMap((workoutSet) => Object.values(workoutSet))
    .flatMap((workout) => workout.exercises);
  assert.ok(
    everyExercise.every(
      (exercise) =>
        (typeof exercise.prescription === "string") !== Array.isArray(exercise.prescriptions),
    ),
  );
  assert.ok(
    everyExercise
      .filter((exercise) => Array.isArray(exercise.prescriptions))
      .every(
        (exercise) =>
          exercise.prescriptions.length === 3 &&
          exercise.prescriptions.every((value) => typeof value === "string" && value.length > 0) &&
          typeof exercise.resetCue === "string" &&
          exercise.resetCue.length > 0,
      ),
  );

  const gymCaptainChairRaises = Object.values(parsedWorkouts.workouts)
    .flatMap((workout) => workout.exercises)
    .filter((exercise) => exercise.name === "Captain’s Chair Leg Raise");
  assert.equal(gymCaptainChairRaises.length, 2);
  assert.ok(
    gymCaptainChairRaises.every(
      (exercise) =>
        exercise.video === "https://www.youtube.com/watch?v=7KDDZtaUaxw" &&
        /without swinging/i.test(exercise.details),
    ),
  );
  assert.equal(
    Object.values(parsedWorkouts.homeWorkouts)
      .flatMap((workout) => workout.exercises)
      .some((exercise) => /captain/i.test(exercise.name)),
    false,
  );

  const squat = parsedWorkouts.workouts.lower.exercises.find(
    (exercise) => exercise.name === "Dumbbell Goblet Squat",
  );
  const legPress = parsedWorkouts.workouts.lower.exercises.find(
    (exercise) => exercise.name === "Seated Leg Press",
  );
  const lateralRaise = parsedWorkouts.workouts.upper.exercises.find(
    (exercise) => exercise.name === "Dumbbell Lateral Raise",
  );
  assert.match(squat.details, /knees outward.*outer edges of your feet/i);
  assert.match(legPress.details, /knees outward over your middle toes/i);
  assert.match(lateralRaise.details, /shoulders away from your ears.*without swinging/i);

  const videos = Object.values(parsedWorkouts.workouts)
    .flatMap((workout) => workout.exercises)
    .map((exercise) => exercise.video);
  assert.ok(videos.length > 0);
  assert.ok(videos.every((url) => /^https:\/\/www\.youtube\.com\/watch\?v=/.test(url)));
  assert.match(serviceWorker, /CACHE_NAME/);

  await Promise.all([
    access(new URL("dist/client/icon-192.png", root)),
    access(new URL("dist/client/icon-512.png", root)),
    access(new URL("dist/client/apple-touch-icon.png", root)),
    access(new URL("dist/client/og.png", root)),
  ]);
});
