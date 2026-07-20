# Prompt Log

## Run 1
Baseline prompt: asked for alt text, long description, and visible text, but did not give extra prioritization rules.
Measured results: 12/12 under 125 characters, 12/12 conveyed equivalent purpose, and 3/3 flyers captured event details.
The main failure pattern was missing or incomplete visible text on text-heavy images, especially flyers and the chart screenshot.

## Run 2
Changed the prompt to prioritize embedded event text for flyers, posters, signs, screenshots, and graphics.
Measured results: 12/12 under 125 characters, 11/12 conveyed equivalent purpose, and 3/3 flyers captured event details.
Improved failures: none. Regressions/new failures: 07_nature_forest_path.png.

## Run 3
Changed the prompt again to emphasize equivalent purpose, chart trends, and uncertainty for dark or ambiguous images.
Measured results: 12/12 under 125 characters, 11/12 conveyed equivalent purpose, and 3/3 flyers captured event details.
Improved failures: none. Regressions/new failures: none.
Regression note: no automated regression was detected in the heuristic scoring, but the hard ambiguous image remained a manual-risk case because the model can sound confident about unclear subjects.
