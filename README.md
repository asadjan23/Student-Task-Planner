# Student Task Planner

This is a lightweight, client-side Student Task Planner built with HTML, CSS, and vanilla JavaScript.

Features
- Interactive background with SVG icons and parallax
- Persistent tasks saved to localStorage
- Progress bar, daily streak tracking, and motivational daily quotes
- Settings panel (theme, reduced motion, accent colors)
- Confetti and small animations (respecting reduced-motion)

Files
- `index.html` — main application UI
- `java.js` — application logic (tasks, persistence, streaks, quotes, confetti)
- `style.css` — styles, themes, responsive layout
- `home.html` — landing/home page

How to push to GitHub

1. Create a repository on GitHub (public or private).
2. Add the GitHub remote and push from this folder:

```powershell
cd "F:\I am Re_active Now\Student Task Planner"
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

If you have the GitHub CLI installed you can instead run:

```powershell
gh repo create <repo-name> --public --source=. --remote=origin --push
```

If the repo isn't initialized locally yet, the steps below will initialize and commit first (the assistant will do this locally upon request):

```powershell
git init
git add .
git commit -m "Initial commit: Student Task Planner"
```

Notes
- This repo is a static frontend project and doesn't require a build step. You can host it on GitHub Pages by enabling Pages for the repository and pointing it at the `main` branch's root.
