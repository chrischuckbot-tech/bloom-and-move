# Erie’s Workout

A tiny, mobile-first workout calendar that works as an installable iPhone web app. It has no server, no accounts, and no sensitive data.

## Change the workouts

Edit [`public/workouts.json`](public/workouts.json). The important pieces are:

- `schedule`: which workout appears on each weekday
- `workouts`: gym titles, exercises, sets/reps, cues, and YouTube links
- `homeWorkouts`: no-equipment bodyweight and cardio alternatives

The calendar uses the normal Sunday-to-Saturday layout. Workout Day 1 is always Monday: lower body Monday, upper body Tuesday, a treadmill run/jog at the gym or indoor cardio circuit at home on Wednesday, lower body Thursday, and upper body Friday.

Workout location, exercise progress, and completed days are saved locally on the device. The app has no account or cloud sync.

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
