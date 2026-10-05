/* Development-only D1 adapter; production uses the Sites-managed binding. */
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
module.exports = function localContentDatabase() {
  const sql = new DatabaseSync(':memory:'); sql.exec('PRAGMA foreign_keys = ON');
  for (const file of fs.readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) sql.exec(fs.readFileSync('drizzle/' + file, 'utf8'));
  return {
    prepare(query) {
      const statement = sql.prepare(query);
      const bound = args => ({ bind: (...next) => bound(next), async first() { return statement.get(...args) || null; }, async all() { return { results: statement.all(...args) }; }, async run() { return statement.run(...args); } });
      return bound([]);
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try { const result = []; for (const s of statements) result.push(await s.run()); sql.exec('COMMIT'); return result; }
      catch (e) { sql.exec('ROLLBACK'); throw e; }
    },
  };
};
