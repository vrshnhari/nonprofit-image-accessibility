# Prompt Log

## Run 1
Baseline prompt: asked for short alt text, a long description, and visible text, but did not give extra rules for hard cases. I measured all 12 images before Groq's daily token limit kicked in. Results: 12/12 were under 125 characters, 12/12 conveyed equivalent purpose by the rubric, and 3/3 flyers captured event details. The main weakness was that the two hard cases still need manual review because the chart and dark ambiguous image are exactly where a model can sound confident even when the image is difficult.

## Run 2
I changed the prompt to prioritize embedded event text for flyers, posters, signs, screenshots, and graphics. I measured 7/12 images before Groq hit the daily token limit again. The flyer rows still captured event details, but one regression appeared: the forest path image was described as deforestation/tree-stump imagery even though that meaning was not present. This is a useful regression because it shows that pushing the prompt toward purpose can make the model over-interpret simple images.

## Run 3
I changed the app prompt again to emphasize equivalent purpose, chart trends, and uncertainty for dark or ambiguous images. This is now the production prompt in `lib/groq.ts`, but I could not measure Run 3 today because Groq returned a daily token-limit error before any Run 3 image could be processed. The workbook marks those rows as pending instead of inventing results. Next step is to rerun the cached script after the Groq quota resets so Run 3 can be measured against the same 12 images.
