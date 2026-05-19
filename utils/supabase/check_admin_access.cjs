const pg = require('pg');
const { Client } = pg;

const connectionString = 'postgresql://postgres:Jp%24%2B8_Z%25*v*Px_3@db.ttucctuxeshguahctwqk.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('\n--- RLS POLICIES FOR turmas AND alunos ---');
    const policiesRes = await client.query(`
      SELECT 
        policyname, 
        tablename, 
        schemaname, 
        cmd, 
        qual, 
        with_check 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename IN ('turmas', 'alunos', 'logs_sistema');
    `);
    console.log(JSON.stringify(policiesRes.rows, null, 2));

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await client.end();
  }
}

run();
