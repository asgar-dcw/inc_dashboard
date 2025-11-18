import { analyzeKeyTables, getSampleData } from '../services/database-schema-analyzer';
import { testConnection } from '../services/database';

const main = async () => {
  try {
    console.log('[INFO] Starting database schema analysis...');
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('[ERROR] Database connection failed');
      process.exit(1);
    }

    // Analyze key tables
    console.log('[INFO] Analyzing key tables...');
    const schema = await analyzeKeyTables();

    // Get sample data from key tables
    console.log('[INFO] Getting sample data...');
    const samples: any = {};
    
    const keyTables = [
      'sales_order',
      'sales_order_item',
      'customer_entity',
      'catalog_product_entity',
      'quote_item_option'
    ];

    for (const table of keyTables) {
      try {
        const sample = await getSampleData(table, 2);
        samples[table] = sample;
        console.log(`[OK] Got sample from ${table}`);
      } catch (error) {
        console.error(`[ERROR] Failed to get sample from ${table}:`, error);
      }
    }

    // Output results
    console.log('\n=== DATABASE SCHEMA ANALYSIS ===\n');
    
    for (const [table, columns] of Object.entries(schema)) {
      console.log(`\nTable: ${table}`);
      console.log(`Columns (${columns.length}):`);
      columns.forEach((col: any) => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      if (samples[table]) {
        console.log(`Sample data (${samples[table].length} rows):`);
        samples[table].forEach((row: any, idx: number) => {
          console.log(`  Row ${idx + 1}:`, Object.keys(row).slice(0, 5).join(', '), '...');
        });
      }
    }

    console.log('\n[OK] Schema analysis complete!');
  } catch (error) {
    console.error('[ERROR] Schema analysis failed:', error);
    process.exit(1);
  }
};

main();

