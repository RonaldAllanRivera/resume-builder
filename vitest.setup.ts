// Any setup scripts you might need go here

// Fills gaps only — .env.test is loaded in vitest.config.mts and wins,
// because dotenv does not override vars that are already set.
import 'dotenv/config'
