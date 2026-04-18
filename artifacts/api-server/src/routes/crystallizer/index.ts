import { Router } from "express";
import { z } from "zod";
import { crystallize } from "../../services/crystallize.js";
import type { Request, Response } from "express";

const router = Router();

const CrystallizerInput = z.object({
  intent: z.string().min(1).max(2000),
});

const EditLogEvent = z.object({
  session_id: z.string().uuid(),
  field: z.enum(["maximize", "must_not_break", "success_criterion"]),
  edited: z.boolean(),
  timestamp: z.string().datetime(),
});

router.post("/crystallize", async (req: Request, res: Response) => {
  const parsed = CrystallizerInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const result = await crystallize(parsed.data.intent);

    if (result.status === "clarify") {
      res.status(200).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    req.log.error({ err }, "crystallize failed");
    res.status(500).setHeader("Retry-After", "5").json({ error: "LLM service error" });
  }
});

router.post("/log-edit", (req: Request, res: Response) => {
  const parsed = EditLogEvent.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid log event" });
    return;
  }

  req.log.info({ editEvent: parsed.data }, "edit_log");
  res.status(204).end();
});

export default router;
