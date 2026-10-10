# Rishant Prakash — Small grains. Cosmic stories.

A personal research website about cosmochemistry, meteorites, and isotope geochemistry. The site combines CV-based research and education content with an interactive, illustrative Rayleigh-fractionation experiment and short educational stories about asteroids, meteorites, and isotopes.

## Site files

This is a static HTML, CSS, and JavaScript site. There is no build step, package installation, or backend.

- `index.html`: biography, research projects, education, selected contributions, contact information, scientific context, and source credits.
- `styles.css`: responsive layout, typography, dialogs, and visual styling.
- `main.js`: navigation, educational dialogs, source credits, and small interface behaviors.
- `isotope.js`: the interactive Rayleigh model and its SVG plot.
- `assets/bennu.jpg`: credited NASA Scientific Visualization Studio Bennu imagery.
- `assets/favicon.svg`: site icon.
- `assets/Rishant-Prakash-CV.pdf`: the supplied CV, linked for viewing and download.
- `useful-links.html`: a compatibility redirect from the inherited page URL to the research section.
- `sitemap.xml`: the primary GitHub Pages URL.
- `.nojekyll`: serves the static files directly without Jekyll processing.

Use relative paths for local files so the site works both in local preview and under the repository path on GitHub Pages.

## Local preview

From the repository root, start a local server:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/). JavaScript modules require an HTTP server; opening `index.html` directly with a `file:` URL will not run the interactive lab reliably. Stop the server with `Ctrl+C`.

## GitHub Pages

The repository is `rishantp22/rishantprakash.github.io`. Configure **Settings → Pages → Build and deployment** to deploy from a branch, using **`master`** and **`/ (root)`**. The `.nojekyll` file must remain in the root.

The expected default Pages URL for this repository is:

[https://rishantp22.github.io/rishantprakash.github.io/](https://rishantp22.github.io/rishantprakash.github.io/)

The account name is `rishantp22`, while the repository name is `rishantprakash.github.io`. Consequently this is a project-site URL; naming the repository `rishantprakash.github.io` does not itself assign the domain `rishantprakash.github.io`. A separately configured custom domain would need corresponding Pages/DNS settings and an updated sitemap.

Review website changes on a branch and merge them into `master` when ready to publish. A local preview or an unmerged branch does not establish that GitHub Pages is enabled or that deployment has succeeded.

## Editing and content provenance

Rishant has confirmed his current affiliation as a Ph.D. student in Planetary and Space Sciences at the University of Central Florida (UCF). Arizona State University is a previous research affiliation. The supplied `Prakash_Rishant_CV_.pdf` is a historical source for research, education, contact information, and contributions; it lists M.S. Geological Sciences at ASU and research beginning in 2023 and 2024. No ASU graduation or end date, or UCF start date, has been assumed. The downloadable CV may retain the earlier ASU status until Rishant supplies an updated version.

The AAS contribution is shown as 2026 because the CV gives January 4–8, 2026 and a 2026 citation, despite one conflicting “2025” label. Contributions are labeled as conference contributions, a poster, and a meteorite classification entry. They should not be relabeled as peer-reviewed research articles without supporting information.

The interactive lab uses an idealized Rayleigh model, with illustrative parameters and explicit assumptions. It is an educational demonstration, not a dataset from Rishant's research. The Bennu image is an educational illustration and does not claim that Rishant studied Bennu samples. Links to scientific sources and image credits are available in the site's credits dialog.

To update the CV, replace `assets/Rishant-Prakash-CV.pdf`, then review all biography, project, education, and contribution dates in `index.html`. To change the deployed URL, update `sitemap.xml` and this README together.

## Inherited source and licensing

This repository was forked from Tanmay Singh's website. The earlier AcademicPages/Jekyll source, prior assets, and the original `LICENSE` are retained for provenance and reference. The current root `index.html` uses the static files listed above; it does not import the inherited biography, publications, navigation, or Jekyll content. The previous `useful-links.html` route now redirects to the new research section.

Retained source files and assets may still be directly addressable by their paths when GitHub Pages serves the repository. They are not part of the new site's navigation. The original `LICENSE` remains unchanged, and third-party assets retain their applicable licenses and credits. NASA imagery attribution is included on the page.
