import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

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
  assert.equal(parsedWorkouts.schedule.monday.label, "Day 1");
  assert.equal(parsedWorkouts.schedule.wednesday.workout, "cardio");
  assert.equal(parsedWorkouts.workouts.cardio.title, "30-Minute Walk-Run");
  assert.equal(parsedWorkouts.workouts.cardio.duration, "30 min");
  assert.equal(parsedWorkouts.workouts.cardio.exercises[0].name, "Walk-Run Intervals");
  assert.equal(parsedWorkouts.schedule.friday.label, "Day 5");
  assert.equal(parsedWorkouts.workouts.lower.exercises.length, 6);
  assert.equal(parsedWorkouts.workouts.upper.exercises.length, 6);
  assert.match(parsedWorkouts.workouts.upper.note, /2 reps in reserve \(RIR\)/i);
  assert.equal(parsedWorkouts.homeWorkouts.lower.title, "At-Home Legs + Cardio");
  assert.equal(parsedWorkouts.homeWorkouts.lower.exercises.length, 6);
  assert.equal(parsedWorkouts.homeWorkouts.upper.exercises.length, 6);
  assert.equal(parsedWorkouts.homeWorkouts.cardio.duration, "About 30 min");
  assert.equal(parsedWorkouts.homeWorkouts.cardio.exercises.length, 4);
  assert.match(parsedWorkouts.homeWorkouts.lower.note, /no equipment needed/i);
  assert.ok(
    Object.values(parsedWorkouts.homeWorkouts).every(
      (workout) =>
        workout.exercises.length === 0 ||
        workout.exercises[0].name === "Jog Around the Block",
    ),
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
      (exercise) => exercise.name === "Step-Back Burpee",
    ),
  );
  assert.ok(
    parsedWorkouts.homeWorkouts.lower.exercises.some(
      (exercise) => exercise.name === "Bodyweight Squat",
    ),
  );
  assert.ok(
    parsedWorkouts.homeWorkouts.upper.exercises.some(
      (exercise) => /back/i.test(exercise.name),
    ),
  );
  assert.equal(
    Object.values(parsedWorkouts.homeWorkouts)
      .flatMap((workout) => workout.exercises)
      .some((exercise) => /shadowbox/i.test(exercise.name)),
    false,
  );
  assert.equal("intensity" in parsedWorkouts, false);
  assert.equal("tips" in parsedWorkouts, false);

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
