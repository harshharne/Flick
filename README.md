# Flick: toss, withdrawal, instructions

Design assessment site. Plain HTML, CSS and JavaScript, with no build step.

## Files

- `index.html`: all the content
- `styles.css`: layout and type
- `script.js`: the interactive die and breathing pacer in section 6

## Preview locally

Open `index.html` in a browser, or run a local server from this folder:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy

1. Create an empty repository on GitHub (for example `flick-assessment`).
2. From this folder:

   ```
   git init
   git add .
   git commit -m "Flick assessment site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/flick-assessment.git
   git push -u origin main
   ```

3. On vercel.com, choose Add New, then Project, and import the repository.
4. Leave Framework Preset as Other, with no build command and no output directory. Deploy.

Every push to `main` redeploys automatically.

## Before submitting

- Check every claim in section 2 against its reference.
- Replace the persona (section 4) if you have real interview material.
- Flick is a working name.
