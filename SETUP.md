# Putting Big Two online

This takes about 15 minutes. Both sites below are free and don't need a credit card.

## 1. Put the files on GitHub

1. Unzip `big-two.zip`. You get a folder called `big-two`.
2. Sign up or log in at https://github.com.
3. Click **+** (top right), then **New repository**.
4. Name it `big-two`. You can leave it **Public** or choose **Private**; both work. Click **Create repository**.
5. On the next page, click the **uploading an existing file** link.
6. Open the `big-two` folder on your computer, select everything inside it (`public`, `server.js`, `engine.js`, `package.json`, `README.md`, `SETUP.md`) and drag it all into the browser window.
   Make sure the `public` folder goes in with `index.html` inside it.
7. Click **Commit changes**.

## 2. Run it on Render

1. Go to https://render.com and click **Get Started**. Sign up with your GitHub account; it's the easiest way.
2. Click **New +**, then **Web Service**.
3. Connect your GitHub account if it asks, then pick the `big-two` repository.
4. Fill in the settings:
   - **Name:** anything, e.g. `big-two-bora`. This becomes part of the link.
   - **Language / Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Click **Create Web Service**. Wait a minute or two until the log says `Big Two is running` and the status turns **Live**.
6. Your link is at the top of the page, something like `https://big-two-bora.onrender.com`. Send it to your friends.

## 3. Game night

1. Everyone opens the link, types their name and clicks **Sit down**.
2. Leave **Fill empty seats with bots** on if you're short of players.
3. Anyone seated clicks **Shuffle and deal**. After that, only the loser deals.

## Good to know

- **The first visit can be slow.** Free Render servers go to sleep after 15 minutes with nobody on them. The first person to open the link waits up to a minute; then it runs normally.
- **Scores reset when the server sleeps.** The hall of shame covers one game night, not forever.
- **Changes later:** if Claude gives you updated files, upload them to the same GitHub repository (**Add file**, then **Upload files**, replacing the old ones). Render updates the game by itself within a couple of minutes.
