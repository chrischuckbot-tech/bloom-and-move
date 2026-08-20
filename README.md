# Erie’s Workout

A tiny, mobile-first rolling strength and conditioning plan that works as an installable iPhone web app. It has no server, no accounts, and no sensitive data.

## Change the workouts

Edit [`public/workouts.json`](public/workouts.json). The important pieces are:

- `rotation`: the order workouts appear in the rolling queue
- `workouts`: gym titles, exercises, sets/reps, cues, and YouTube links
- `homeWorkouts`: no-equipment bodyweight and cardio alternatives

Strength and core exercises contain three `prescriptions`. The app automatically
shows the next prescription on each rotation round. After the third round, the
wave restarts and that exercise's `resetCue` appears with the next difficulty step.
Warm-ups and cardio keep a single static `prescription`.

The plan is not tied to weekdays. It keeps the current workout on screen until “Finished this workout” is tapped, then advances through lower body, upper body, cardio, lower body, and upper body before starting the rotation again. Workdays and rest days can happen whenever needed.

Workout location, exercise progress, and the current rotation position are saved locally on the device. The app has no account or cloud sync.

## Run it locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Publish on GitHub Pages

1. Create an empty GitHub repository and push this folder to its `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. Push a change. The included workflow builds and publishes the app automatically.

On iPhone, open the published URL in Safari, tap **Share**, then **Add to Home Screen**.
