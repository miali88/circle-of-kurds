import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const paths = process.argv.slice(2);
if (!paths.length) {
  console.error("Usage: npm run review -- IMAGE [IMAGE ...]");
  process.exit(2);
}

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY to review the images.");
  process.exit(2);
}

const google = createGoogleGenerativeAI({ apiKey });
const content = [{
  type: "text",
  text: "Compare these candidate hero backgrounds for a UK Kurdish business directory. Score each from 1 to 5 on legibility of an ivory heading over the left side, visual appeal, fit for an editorial directory, desktop and portrait crop resilience, and whether the image could be mistaken for a real listed business. Name a winner and recommend crop positions and overlay strength. Distinguish visible details from assumptions."
}];
for (const path of paths) {
  content.push({ type: "text", text: "Candidate: " + basename(path) });
  content.push({ type: "image", image: await readFile(path) });
}

const { text } = await generateText({
  model: google("gemini-3.5-flash"),
  messages: [{ role: "user", content }],
  maxRetries: 1,
  maxOutputTokens: 2400
});
console.log(text);
