# Medigo marketing site

Static site (HTML/CSS/JS).

## CI

GitHub Actions runs Prettier formatting checks on pull requests and pushes to `main`.

## CD (GitHub Pages)

This repo includes a GitHub Actions workflow that deploys the site to GitHub Pages on every push to `main`.
No secrets are required.

### One-time repo setup

In GitHub:

1. Go to **Settings → Pages**.
2. Set **Build and deployment** to **GitHub Actions**.
