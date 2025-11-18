import { executeQuery } from './database';

// Analyze database schema to understand actual table structures
export const analyzeTableSchema = async (tableName: string) => {
  try {
    const query = `DESCRIBE ${tableName}`;
    const columns = await executeQuery<any>(query);
    return columns;
  } catch (error) {
    console.error(`Error analyzing table ${tableName}:`, error);
    return [];
  }
};

// Get all columns for a table
export const getTableColumns = async (tableName: string) => {
  try {
    const query = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `;
    const columns = await executeQuery<any>(query, [tableName]);
    return columns;
  } catch (error) {
    console.error(`Error getting columns for ${tableName}:`, error);
    return [];
  }
};

// Analyze key tables for dashboard
export const analyzeKeyTables = async () => {
  const keyTables = [
    'sales_order',
    'sales_order_item',
    'sales_order_grid',
    'customer_entity',
    'customer_grid_flat',
    'catalog_product_entity',
    'catalog_product_entity_varchar',
    'report_viewed_product_index',
    'quote_item_option',
    'quote_item',
    'quote',
    'mst_search_report_log',
    'sales_bestsellers_aggregated_daily'
  ];

  const schema: any = {};

  for (const table of keyTables) {
    try {
      const columns = await getTableColumns(table);
      schema[table] = columns;
      console.log(`[OK] Analyzed ${table}: ${columns.length} columns`);
    } catch (error) {
      console.error(`[ERROR] Failed to analyze ${table}:`, error);
      schema[table] = [];
    }
  }

  return schema;
};

// Get sample data from a table to understand structure
export const getSampleData = async (tableName: string, limit: number = 5) => {
  try {
    const query = `SELECT * FROM ${tableName} LIMIT ?`;
    const samples = await executeQuery<any>(query, [limit]);
    return samples;
  } catch (error) {
    console.error(`Error getting sample data from ${tableName}:`, error);
    return [];
  }
};

