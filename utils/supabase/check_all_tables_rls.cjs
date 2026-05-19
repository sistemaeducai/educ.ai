const pg = require('pg');
const { Client } = pg;

const connectionString = 'postgresql://postgres:Jp%24%2B8_Z%25*v*Px_3@db.ttucctuxeshguahctwqk.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('\n--- RLS STATUS AND POLICIES FOR ALL TABLES ---');
    const rlsRes = await client.query(`
      SELECT 
        tablename, 
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    console.log('RLS Status:');
    console.log(JSON.stringify(rlsRes.rows, null, 2));

    const policiesRes = await client.query(`
      SELECT 
        policyname, 
        tablename, 
        schemaname, 
        cmd, 
        qual, 
        with_check 
      FROM pg_policies 
      WHERE schemaname = 'public';
    `);
    console.log('\nPolicies:');
    console.log(JSON.stringify(policiesRes.rows, null, 2));

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await client.end();
  }
}

run();
