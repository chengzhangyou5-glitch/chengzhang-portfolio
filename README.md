# Portfolio website

Minimal static placeholder site hosted on Netlify.

- `/`: website home
- `/portfolio`: stable PDF portfolio entry point

The site uses local HTML, CSS and JavaScript, with no build dependencies. Netlify publishes the `public` folder. Its redirect rule serves `index.html` for direct visits to `/portfolio`, and `script.js` selects the page by URL.

## Update

Edit files in `public`, then commit and push to `main`. Netlify will deploy the new commit when the GitHub repository is connected to the site. To replace the PDF placeholder later, update the `/portfolio` branch in `public/script.js` and add the PDF under `public`.
