# Hero image

The storefront and person are fictional. The selected image was created with Codex’s built-in image generation tool and compressed to WebP for the site.

## Generation prompt

Use case: photorealistic-natural. Create a single wide landscape background photograph for a contemporary directory of Kurdish businesses in the UK. Editorial street photograph of a small independent London shop/café front in warm dusk light, one fictional shopkeeper visible through an inviting window, red-brown brick, deep evergreen painted wood, shelves with pottery and a woven rug in the window. All narrative activity and architectural detail in the right half around x=72%; dark inky forest-green painted wall in shadow fills the left 50% of the frame to support overlay text. Frame at sidewalk level with subtle wet-street reflections and quiet amber light, natural candid film photography and fine grain, sophisticated restrained colour grading, inviting and lived-in. A single wide 2.5:1-like composition. No signage, legible text, logos, watermarks or existing establishments.

## Optional review with Gemini

The AI SDK review command compares candidate images for desktop and mobile crop, legibility, visual appeal and suitability. Use Node.js 22 or newer and set a Google Gemini API key in the environment.

```sh
cd tools/hero-review
npm ci
npm run review -- /path/to/candidate-a.png /path/to/candidate-b.png
```

The command sends only the image files passed as arguments to Google’s Gemini 3.5 Flash API. It runs separately from the site.
