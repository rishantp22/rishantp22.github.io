# Rishant Prakash — Small grains. Cosmic stories.

A personal research website about cosmochemistry, meteorites, and isotope geochemistry. The site combines CV-based research and education content with an interactive field atlas, laboratory-method pages, an illustrative Rayleigh-fractionation experiment, isotope notation games, and short educational stories about asteroids, meteorites, and isotopes.

## Site files

This is a static HTML, CSS, and JavaScript site. There is no build step, package installation, or backend.

- `index.html`: biography, research projects, education, selected contributions, contact information, scientific context, and source credits.
- `geology.html`, `field-map.js`: terrestrial research and an interactive field map; city-level points are approximate, with all field notes readable without the map.
- `laboratory.html`: sample chemistry, standards, and in-situ analysis with an interactive workflow.
- `field-lab.css`: shared subpage styling.
- `outdoors.html`, `outdoors.css`, `meteor-dodge.js`: a hiking, views, and camping photo journal in progress, with a playable meteor-dodging arcade game.
- `meteors.js`: decorative meteor showers that become more frequent while scrolling, reduced-motion support, pause control, and background-tab suspension.
- `styles.css`: responsive layout, typography, dialogs, and visual styling.
- `main.js`: navigation, educational dialogs, source credits, and small interface behaviors.
- `isotope-games.html`, `isotope-games.js`, `isotope-games.css`: a meteorite epsilon calculation game and a presolar-grain percentage explorer; examples and measurement sources are distinguished on the page.
- `isotope.js`: the interactive Rayleigh model and its SVG plot.
- `assets/bennu.jpg`: credited NASA Scientific Visualization Studio Bennu imagery.
- `assets/favicon.svg`: site icon.
- `assets/Rishant-Prakash-CV.pdf`: the updated professional CV, linked for viewing and download.
- `assets/documents/`: Rishant’s M.Tech. thesis, M.Sc. dissertation, ONGC report, and PRL project report, hosted as original PDFs on GitHub Pages.
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

The repository is `rishantp22/rishantp22.github.io`. Configure **Settings → Pages → Build and deployment** to deploy from a branch, using **`master`** and **`/ (root)`**. The `.nojekyll` file must remain in the root.

The expected default Pages URL for this repository is:

[https://rishantp22.github.io/](https://rishantp22.github.io/)

This is the account-level GitHub Pages site. The repository name matches `rishantp22.github.io`, so visitors use the short root URL. The `rishantprakash.github.io/index.html` compatibility page redirects the previous project URL to the root, preserving its fragment.

Review website changes on a branch and merge them into `master` when ready to publish. A local preview or an unmerged branch does not establish that GitHub Pages is enabled or that deployment has succeeded.

## Traffic analytics

The five primary pages use Google Analytics 4 for visitor and engagement reporting. The Google tag is included once in each page’s head and initializes only on `rishantp22.github.io`, so local previews do not send page views. Enhanced measurement covers page loads, scrolling, outbound links, and file-download link clicks. Browser-history page views and form interactions are disabled. Keep the tag consistent across the five pages when editing the site.

## Editing and content provenance

Rishant is a Ph.D. student in Planetary and Space Sciences in the Department of Physics at the University of Central Florida (UCF), beginning August 2026. He earned an M.S. in Geological Sciences at Arizona State University’s School of Earth and Space Exploration in July 2026. The downloadable CV includes his academic history, UCF email, two 2026 Meteoritical Society abstracts, and a NASA Travel Award for presenting research at the 88th Annual Meeting of the Meteoritical Society in Frankfurt, Germany.

The 2026 AAS conference abstract, “Presolar oxide grains as probes of symmetric and asymmetric core-collapse supernova explosions,” links to ADS record `2026AAS...24727701P`. Contributions are labeled as conference abstracts, posters, and a meteorite classification entry; they are distinct from peer-reviewed research articles.

The interactive lab uses an idealized Rayleigh model, with illustrative parameters and explicit assumptions. It is an educational demonstration, not a dataset from Rishant's research. The Bennu image is an educational illustration and does not claim that Rishant studied Bennu samples. Links to scientific sources and image credits are available in the site's credits dialog.

The isotope games use five fictional, already-corrected meteorite ratios for arithmetic practice. Epsilon and mu are defined as relative ratio differences multiplied by 10,000 and 1,000,000, respectively; scaling is not a mass-fractionation correction. The presolar explorer compares a selected ratio with its solar reference and distinguishes percentage deviation from percentage of the reference. Its 57× preset is a rounded illustration motivated by the published Orgueil grain 2_37, not a replacement for the measured ratio and uncertainty cited on the page. The two measurement contexts are explained separately.

The laboratory diagram uses an ideal uniform 180-degree magnetic sector: positive Ti ions at a common accelerating voltage follow circular radii proportional to the square root of mass. All beams bend in the same direction for a field out of the page, then leave tangentially. Relative radii are to scale; collector spacing is enlarged 12 times only in the labeled inset. The explanatory equations and source links distinguish this model from a particular MC-ICP-MS instrument layout.

The Shergotty story combines Rishant’s own ancestral connection and future fieldwork aspiration with fall and recovery history from ASU, Caltech, and the Smithsonian. Its date is the witnessed Earth fall (25 August 1865), distinct from crystallization or ejection age; the anniversary count updates automatically. No mapped strewn field, ancestral village coordinates, or remaining recoverable fragments are asserted.

The outdoors page reflects Rishant’s stated interests in hiking, scenic views, and camping. Its gallery panels are labeled illustrations for future photographs, not records of trips or uploaded images. The meteor-dodging game uses bright, tapered meteor streaks in a shared direction. Its frequency, scale, and collisions are fictional arcade conventions. The science panel uses NASA’s approximate 44-tonne daily global infall estimate and converts that mass rate into hourly, minute, and second averages. It distinguishes background infall from visible meteor showers and from surviving ground meteorites.

The four research documents formerly linked from Google Drive are hosted locally under `assets/documents/`. Their original bytes were preserved after confirming the title and author on each PDF. Website and CV links use the GitHub Pages copies.

To update the CV, replace `assets/Rishant-Prakash-CV.pdf`, then review all biography, project, education, and contribution dates in `index.html`. To change the deployed URL, update `sitemap.xml` and this README together.

## Inherited source and licensing

This repository was forked from Tanmay Singh's website. The earlier AcademicPages/Jekyll source, prior assets, and the original `LICENSE` are retained for provenance and reference. The current root `index.html` uses the static files listed above; it does not import the inherited biography, publications, navigation, or Jekyll content. The previous `useful-links.html` route now redirects to the new research section.

Retained source files and assets may still be directly addressable by their paths when GitHub Pages serves the repository. They are not part of the new site's navigation. The original `LICENSE` remains unchanged, and third-party assets retain their applicable licenses and credits. NASA imagery attribution is included on the page.
