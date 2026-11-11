# Reboot the Future

A student e-waste awareness website for National Public School, Koramangala.

## Publish on GitHub Pages

1. Upload `index.html`, `style.css`, `app.js`, and this README to your GitHub repository. Do not upload `.env` or database files.
2. On GitHub, open the repository's **Settings**, then **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**. Choose your default branch (usually `main`) and `/ (root)`, then select **Save**.
4. Wait for deployment. The Pages settings page will show the website link.

This version is a static website. It does not use the former Node.js server or password-protected dashboard.

## Update the progress percentage

On GitHub, open `app.js`, click the pencil icon, and change:

```js
const progressPercent = 50;
```

Replace `50` with the desired percentage from 0 to 100. Click **Commit changes**. GitHub Pages will republish the site, and everyone will see the updated progress. Only people with permission to edit the repository can update it. Do not add a password to the public code.

## Make other changes

- Edit the team names and website text in `index.html`. The spelling of Gaurisha's name has not been independently verified; confirm it with the team.
- Change colours, layouts and responsive styling in `style.css`.
- Click the small star at the bottom of the page seven times to reveal the website maker credit.
