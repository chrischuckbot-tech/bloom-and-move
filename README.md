# Erie’s Workout

A tiny, mobile-first workout calendar that works as an installable iPhone web app. It has no server, no accounts, and no sensitive data.

## Change the workouts

Edit [`public/workouts.json`](public/workouts.json). The important pieces are:

- `schedule`: which workout appears on each weekday
- `workouts`: titles, exercises, sets/reps, cues, and YouTube links
- `tips`: the expandable notes at the bottom

The calendar uses the normal Sunday-to-Saturday layout. Workout Day 1 is always Monday: lower body Monday, upper body Tuesday, a 30-minute walk-run Wednesday, lower body Thursday, and upper body Friday.

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
