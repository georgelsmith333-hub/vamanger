import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { serializeDates } from "../lib/serialize";

const router = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const rows = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(rows.map(r => serializeDates({ ...r, passwordHash: undefined })));
});

router.post("/users", async (req, res): Promise<void> => {
  const { name, email, role = "viewer", status = "active", assignedClients } = req.body;
  if (!name || !email) { res.status(400).json({ error: "name and email required" }); return; }
  const [row] = await db.insert(usersTable).values({ name, email, role, status, assignedClients }).returning();
  res.status(201).json(serializeDates({ ...row, passwordHash: undefined }));
});

router.put("/users/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { name, email, role, status, assignedClients } = req.body;
  const [row] = await db.update(usersTable).set({ name, email, role, status, assignedClients }).where(eq(usersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "User not found" }); return; }
  res.json(serializeDates({ ...row, passwordHash: undefined }));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).send();
});

export default router;
