#!/usr/bin/env node
// Generate a bcrypt hash for use in config/users.json.
// Usage: node scripts/hash-password.mjs '<password>'

import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs '<password>'");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
console.log(hash);
