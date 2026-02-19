/**
 * Seed the database with initial machine data.
 */

import { getDb } from "./database.js";

const SEED_MACHINES = [
  { name: "CNC Mill Alpha-1",      type: "CNC Mill",        location: "Building A — Floor 1" },
  { name: "Conveyor Line B-3",     type: "Conveyor Belt",   location: "Building A — Floor 2" },
  { name: "Hydraulic Press HP-7",  type: "Hydraulic Press", location: "Building B — Floor 1" },
  { name: "Robot Arm R-12",        type: "Industrial Robot", location: "Building B — Floor 2" },
  { name: "Compressor Unit C-5",   type: "Compressor",      location: "Building C — Utility Room" },
  { name: "CNC Mill Alpha-2",      type: "CNC Mill",        location: "Building A — Floor 1" },
  { name: "Conveyor Line B-7",     type: "Conveyor Belt",   location: "Building A — Floor 3" },
  { name: "Hydraulic Press HP-12", type: "Hydraulic Press", location: "Building B — Floor 1" },
];

function randomDaysAgo(min, max) {
  const days = Math.floor(Math.random() * (max - min + 1)) + min;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function seedMachines() {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS cnt FROM machines").get().cnt;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO machines (name, type, location, status, install_date, last_maintenance)
    VALUES (@name, @type, @location, 'operational', @installDate, @lastMaintenance)
  `);

  const tx = db.transaction(() => {
    for (const m of SEED_MACHINES) {
      insert.run({
        name: m.name,
        type: m.type,
        location: m.location,
        installDate: randomDaysAgo(365, 2000),
        lastMaintenance: randomDaysAgo(7, 180),
      });
    }
  });

  tx();
  console.log(`✓ Seeded ${SEED_MACHINES.length} machines`);
}
