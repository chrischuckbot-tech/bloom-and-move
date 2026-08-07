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

  assert.match(html, /<title>Bloom &amp; Move<\/title>/i);
  assert.match(html, /manifest\.webmanifest/i);
  assert.match(html, /og\.png/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    assert.match(html, new RegExp(`${process.env.NEXT_PUBLIC_BASE_PATH}/assets/`));
    assert.doesNotMatch(html, /(?:href=|import\()["']\/assets\//);
  }

  const parsedManifest = JSON.parse(manifest);
  assert.equal(parsedManifest.display, "standalone");
  assert.equal(parsedManifest.start_url, "./");
  assert.equal(parsedManifest.icons.length, 2);

  const parsedWorkouts = JSON.parse(workouts);
  assert.equal(parsedWorkouts.schedule.monday.label, "Day 1");
  assert.equal(parsedWorkouts.schedule.wednesday.workout, "cardio");
  assert.equal(parsedWorkouts.schedule.friday.label, "Day 5");
  assert.equal(parsedWorkouts.workouts.lower.exercises.length, 6);
  assert.equal(parsedWorkouts.workouts.upper.exercises.length, 6);
  assert.equal("intensity" in parsedWorkouts, false);
  assert.equal("tips" in parsedWorkouts, false);

  const squat = parsedWorkouts.workouts.lower.exercises.find(
    (exercise) => exercise.name === "Dumbbell Goblet Squat",
  );
  const lateralRaise = parsedWorkouts.workouts.upper.exercises.find(
    (exercise) => exercise.name === "Dumbbell Lateral Raise",
  );
  assert.match(squat.details, /knees outward.*outer edges of your feet/i);
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
