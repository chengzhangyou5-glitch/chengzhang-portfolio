# Portfolio website

Minimal static placeholder site hosted on Netlify.

- https://youchengzhang.netlify.app/ — website home
- https://youchengzhang.netlify.app/portfolio — stable PDF portfolio entry point

The site uses local HTML, CSS and JavaScript, with no build dependencies. Netlify publishes the `public` folder. Its redirect rule serves `index.html` for direct visits to `/portfolio`, and `script.js` selects the page by URL.

## Update

Edit files in `public`, then commit and push to `main`. Netlify automatically deploys the new commit. To replace the PDF placeholder later, update the `/portfolio` branch in `public/script.js` and add the PDF under `public`.

```sh
git add .
git commit -m "Update portfolio"
git push
```
