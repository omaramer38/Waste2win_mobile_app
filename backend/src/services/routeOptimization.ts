// backend/src/services/routeOptimization.ts
import { pool } from '../database/pool';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Order type expected by the optimizer.
 * Adjust field names to match your database schema.
 */
export interface Order {
  id: number;
  name: string; // e.g., customer name or location name
  latitude: number;
  longitude: number;
  waste?: number; // optional waste % or amount
}

/**
 * Retrieve today's orders assigned to a specific worker.
 * This is a simplified query – adapt the SELECT clause to match your DB schema.
 */
export async function getWorkerOrders(workerId: number): Promise<Order[]> {
  // Example query – assumes `recycle_orders` has `lat` and `lng` columns.
  const [rows] = await pool.query(
    `SELECT ro.id, u.username AS name, ro.lat AS latitude, ro.lng AS longitude, ro.waste AS waste
     FROM recycle_orders ro
     JOIN users u ON u.id = ro.customer_id
     WHERE ro.worker_id = ? AND ro.status_id IN (2, 4)`,
    [workerId]
  );
  // @ts-ignore – rows is any[] from mysql2
  return (rows as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    waste: r.waste ? Number(r.waste) : undefined,
  }));
}

/**
 * Write orders to a temporary CSV file expected by the Python script.
 * The CSV format mirrors `smart_waste_ai/data/bins.csv` (name,lat,lng,waste).
 */
function writeOrdersCsv(orders: Order[]): string {
  const csvLines = ['name,lat,lng,waste'];
  for (const o of orders) {
    const waste = o.waste ?? 0;
    csvLines.push(`${o.name},${o.latitude},${o.longitude},${waste}`);
  }
  const csvContent = csvLines.join('\n');
  const dataDir = path.resolve(__dirname, '../../smart_waste_ai/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, 'temp_orders.csv');
  fs.writeFileSync(filePath, csvContent, 'utf8');
  return filePath;
}

/**
 * Run the Python route‑optimization script.
 * Returns the relative path (from the project root) to the generated HTML map.
 */
export async function runOptimization(orders: Order[]): Promise<string> {
  const csvPath = writeOrdersCsv(orders);
  // The Python script reads `data/bins.csv`. We'll replace it with our temp file.
  // Copy temp file over the default bins.csv so the script uses the latest data.
  const binsPath = path.resolve(__dirname, '../../smart_waste_ai/data/bins.csv');
  fs.copyFileSync(csvPath, binsPath);

  const scriptDir = path.resolve(__dirname, '../../smart_waste_ai');
  // Execute: python main.py
  const { stdout, stderr } = await execAsync('python main.py', { cwd: scriptDir });
  if (stderr) {
    console.error('Python script error:', stderr);
    throw new Error('Route optimization failed');
  }
  // The script generates `smart_route_map.html` inside the same folder.
  const mapFile = 'smart_route_map.html';
  // Return a path that can be served statically, e.g., `/smart_waste_ai/smart_route_map.html`
  return mapFile;
}
