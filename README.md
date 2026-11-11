# Reboot the Future

A student e-waste awareness website for National Public School, Koramangala. The shared impact counter is stored on the server, not in an individual browser.

## Run locally

Install Node.js 22.13 or newer. In PowerShell, from this folder:

```powershell
cd 'C:\Users\vivek_kpqpkg8\Desktop\imkind'
npm.cmd start
```

Open `http://127.0.0.1:3000`. Select **Host dashboard** in the impact section, enter the password and the total collected in kilograms, then save. The total starts unset until the first update. The local password is saved in `.env`, which is ignored by Git; keep this file private. You can change the password there, or set `ADMIN_PASSWORD` as an environment variable to override it. Without a configured password, visitors can view the site but updates are disabled. Passwords must be at least 7 characters; use a long, unique password for a public website.

The database is `waste.sqlite` in this folder by default. Back it up to preserve your total. Set the `DATA_FILE` environment variable to an absolute path to use a different persistent location. Do not expose the database file publicly.

## Share online

Deploy the site files to a Node.js host with HTTPS and a **persistent disk**. Do not upload `.env`; instead, set `ADMIN_PASSWORD` as a secret environment variable, `HOST` to `0.0.0.0`, and `DATA_FILE` to a file on the persistent disk; the host typically supplies `PORT`. Start with `npm start`. A static-only host or ephemeral filesystem will not provide a reliable shared counter. Do not use the dashboard over public HTTP: the password needs HTTPS in transit.

The server is designed for one running instance. Multiple instances do not share the database automatically. Its basic in-memory login throttling is intended for a small project, not a substitute for a managed authentication service on a high-traffic public site.

## Make changes

- Edit the team names and website text in `index.html`. The spelling of Gaurisha's name has not been independently verified; confirm it with the team.
- Change colours, layouts and responsive styling in `style.css`.
- Change the interactive behaviour in `app.js`.
- The host can update the total using the dashboard without editing code.

The small decorative star at the bottom of the page has a secret: click it seven times to reveal the website maker credit.

Run the automated server checks with `npm.cmd test` in PowerShell.
