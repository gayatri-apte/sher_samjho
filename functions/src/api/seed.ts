import type {Request, Response} from "express";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {CLASSICS} from "../data/classics";
import {createHash} from "../utils/hash";
import {createEmbedding} from "../utils/embedding";
import {generateKeywords} from "../utils/keywords";
import {getEraFromPoet, getMovementFromPoet} from "../utils/poetMeta";
import {beginnerTashreehPrompt} from "../prompts/tashreeh.beginner";
import {generateText} from "../services/gemini.service";
import {invalidateCorpus} from "../utils/corpus";
import {sendError} from "../utils/aiErrors";

const PER_CALL = 4; // keeps each call well inside the 180 s timeout

/**
 * POST /admin/seed — adds the starter library of classic shers.
 * Idempotent: skips ones already present, does a few per call, and
 * reports how many remain so the admin page can call it again.
 * @param {Request} _req - Express request
 * @param {Response} res - Express response
 */
export async function seedClassicsHandler(_req: Request, res: Response) {
  try {
    const col = getFirestore().collection("global_poetry_cache");

    // Clean-up: an early version of the sample pages had a "Kulliyaat ·
    // Diwan" header and page number that OCR read into the sher. Remove
    // those scans; the clean sample pages can be scanned again.
    const junk = await col.where("script", "==", "devanagari").get();
    const bad = junk.docs.filter((d) =>
      /^\s*KULLIYA+T|^\s*Kulliya+t/.test(String(d.get("rawUrdu") ?? "")));
    await Promise.all(bad.map((d) => d.ref.delete()));
    const urduJunk = await col.where("script", "==", "urdu").get();
    const bad2 = urduJunk.docs.filter((d) =>
      /^\s*KULLIYA+T|^\s*Kulliya+t/i.test(String(d.get("rawUrdu") ?? "")));
    await Promise.all(bad2.map((d) => d.ref.delete()));
    const missing = [];
    for (const c of CLASSICS) {
      const id = createHash(c.devanagari);
      const snap = await col.doc(id).get();
      if (!snap.exists || !snap.data()?.embedding) missing.push({id, c});
    }

    const batch = missing.slice(0, PER_CALL);
    await Promise.all(batch.map(async ({id, c}) => {
      // One AI call per sher (beginner meaning); deeper levels and other
      // languages are written on demand and cached.
      const [embedding, beginner] = await Promise.all([
        createEmbedding(`${c.devanagari}\n${c.roman}\n${c.themes.join(" ")}`),
        generateText(beginnerTashreehPrompt(c.devanagari)),
      ]);
      const tashreeh = {beginner, intermediate: "", scholar: ""};
      await col.doc(id).set({
        devanagariText: c.devanagari,
        romanText: c.roman,
        script: "devanagari",
        poet: c.poet,
        era: getEraFromPoet(c.poet),
        movement: getMovementFromPoet(c.poet),
        themes: c.themes,
        keywords: generateKeywords(`${c.devanagari} ${c.roman}`),
        embedding,
        tashreeh,
        source: "Classic library",
        attributionConfidence: 1,
        aiGenerated: false,
        hitCount: 0,
        textHash: id,
        createdAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    }));

    invalidateCorpus();
    res.json({
      added: batch.length,
      cleaned: bad.length + bad2.length,
      remaining: missing.length - batch.length,
      total: CLASSICS.length,
    });
  } catch (err) {
    await sendError(res, err, "Seeding");
  }
}
