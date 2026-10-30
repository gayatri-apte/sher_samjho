import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import {toPublicSher} from "../utils/vectors";
import {loadCorpus} from "../utils/corpus";
import {istDate} from "../utils/updateUserStats";

/**
 * GET /sher/:id — one sher by its hash (enables shareable deep links like
 * /poetry-ai/:hash and /ustad/:hash, which used to render empty without
 * router state).
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getSherHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({error: "id required"});
    const snap = await getFirestore()
      .collection("global_poetry_cache").doc(id).get();
    if (!snap.exists) return res.status(404).json({error: "Sher not found"});
    return res.json(toPublicSher(snap.id, snap.data() || {}));
  } catch (err) {
    console.error("getSher error:", err);
    return res.status(500).json({error: "Failed to load sher"});
  }
}

/**
 * GET /feed/daily[?random=1] — the sher of the day (same for everyone on a
 * given IST date), or a random one. Replaces the client downloading the
 * entire collection, embeddings included, just to pick one.
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function dailySherHandler(req: Request, res: Response) {
  try {
    // Only real shers: skip empty scans and long prose pages that OCR
    // picked up (e.g. a poet's biography paragraph).
    const all = (await loadCorpus()).filter((e) => {
      const t = String(e.data.devanagariText ?? e.data.text ?? "").trim();
      return t.length > 10 && t.length <= 400 && t.split("\n").length <= 8;
    });
    if (!all.length) return res.json(null);

    let idx: number;
    if (req.query.random === "1") {
      idx = Math.floor(Math.random() * all.length);
    } else {
      const day = istDate();
      let h = 0;
      for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      const sorted = [...all].sort((a, b) => a.id.localeCompare(b.id));
      idx = h % sorted.length;
      const e = sorted[idx];
      return res.json({...toPublicSher(e.id, e.data), date: day});
    }
    const e = all[idx];
    return res.json(toPublicSher(e.id, e.data));
  } catch (err) {
    console.error("dailySher error:", err);
    return res.status(500).json({error: "Failed to load daily sher"});
  }
}

/**
 * GET /poet/:name — shers by one poet (public fields only).
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function poetShersHandler(req: Request, res: Response) {
  try {
    const name = String(req.params.name || "").trim();
    if (!name) return res.status(400).json({error: "name required"});
    const snap = await getFirestore().collection("global_poetry_cache")
      .where("poet", "==", name).limit(30).get();
    return res.json(snap.docs.map((d) => toPublicSher(d.id, d.data())));
  } catch (err) {
    console.error("poetShers error:", err);
    return res.status(500).json({error: "Failed to load poet"});
  }
}
