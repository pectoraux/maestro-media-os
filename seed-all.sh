#!/bin/bash
# Combined seed script — runs all seeds in order.
# Used during Vercel build to populate the Neon PostgreSQL database.
# All seeds are idempotent (check for existing data before inserting).
set -e
cd /home/z/my-project
echo "=== Running all seeds ==="

echo "--- Seeding base data ---"
bun run seed.ts 2>&1 | grep -E "seeded|complete|Error" || true

echo "--- Seeding Media OS ---"
bun run seed-os.ts 2>&1 | grep -E "seeded|complete|Error" || true

echo "--- Seeding authenticity ---"
bun run seed-authenticity.ts 2>&1 | grep -E "seeded|complete|Error" || true

echo "--- Seeding constitution ---"
bun run seed-constitution.ts 2>&1 | grep -E "seeded|complete|Error" || true

echo "--- Seeding mind ---"
bun run seed-mind.ts 2>&1 | grep -E "seeded|complete|Error" || true

echo "--- Seeding venture ---"
bun run seed-venture.ts 2>&1 | grep -E "seeded|complete|Error" || true

echo "--- Seeding primitives ---"
bun run seed-primitives.ts 2>&1 | grep -E "seeded|complete|Error" || true

echo "--- Seeding auth ---"
bun run seed-auth.ts 2>&1 | grep -E "seeded|complete|Error" || true

echo "=== All seeds complete ==="
