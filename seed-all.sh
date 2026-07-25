#!/bin/bash
# Combined seed script — runs all seeds in order.
# Used during Vercel build to populate the build-time SQLite DB.
cd /home/z/my-project
echo "=== Running all seeds ==="
bun run seed.ts 2>&1 | grep -E "seeded|complete|Error" || true
bun run seed-os.ts 2>&1 | grep -E "seeded|complete|Error" || true
bun run seed-authenticity.ts 2>&1 | grep -E "seeded|complete|Error" || true
bun run seed-constitution.ts 2>&1 | grep -E "seeded|complete|Error" || true
bun run seed-mind.ts 2>&1 | grep -E "seeded|complete|Error" || true
bun run seed-venture.ts 2>&1 | grep -E "seeded|complete|Error" || true
bun run seed-primitives.ts 2>&1 | grep -E "seeded|complete|Error" || true
bun run seed-auth.ts 2>&1 | grep -E "seeded|complete|Error" || true
echo "=== All seeds complete ==="
