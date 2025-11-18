import Groq from 'groq-sdk';
import { executeQuery } from './database';
import dotenv from 'dotenv';

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  console.warn('[Chatbot] GROQ_API_KEY is not set. Chatbot responses will be unavailable.');
}

const groq = new Groq({
  apiKey: groqApiKey || ''
});

// Get comprehensive database schema information
const getSchemaInfo = async (): Promise<string> => {
  try {
    // Key tables for the dashboard
    const keyTables = [
      'sales_order',
      'sales_order_item',
      'sales_order_address',
      'sales_order_payment',
      'customer_entity',
      'catalog_product_entity',
      'quote',
      'quote_item',
      'report_viewed_product_index'
    ];

    let schemaInfo = '=== DATABASE SCHEMA ===\n\n';
    schemaInfo += 'KEY TABLES AND THEIR STRUCTURE:\n\n';

    for (const tableName of keyTables) {
      try {
        // Get column info
        const columns = await executeQuery<any>(
          `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_COMMENT
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           ORDER BY ORDINAL_POSITION`,
          [tableName]
        );

        if (columns.length > 0) {
          schemaInfo += `\n📊 Table: ${tableName}\n`;
          schemaInfo += 'Columns:\n';
          columns.slice(0, 8).forEach((col: any) => {
            const key = col.COLUMN_KEY ? ` [${col.COLUMN_KEY}]` : '';
            const nullable = col.IS_NULLABLE === 'YES' ? ' (nullable)' : '';
            schemaInfo += `  • ${col.COLUMN_NAME}: ${col.DATA_TYPE}${key}${nullable}\n`;
          });
          if (columns.length > 8) {
            schemaInfo += '  • ...\n';
          }
        }
      } catch (error) {
        // Table might not exist, skip it
        continue;
      }
    }

    // Add relationship information
    schemaInfo += '\n\n=== TABLE RELATIONSHIPS ===\n\n';
    schemaInfo += `• sales_order ▸ sales_order_item (order_id)\n• sales_order ▸ sales_order_address (parent_id)\n• sales_order ▸ sales_order_payment (parent_id)\n• sales_order ▸ customer_entity (customer_id)\n• sales_order_item ▸ catalog_product_entity (product_id)`;

    // Add important field notes (short)
    schemaInfo += '\n\n=== KEY FIELDS ===\n\n';
    schemaInfo += `• sales_order: status (filter NOT IN ('canceled','closed')), base_grand_total, created_at, quote_id
• sales_order_item: row_total, qty_ordered
• sales_order_address: address_type ('shipping'), country_id
• sales_order_payment: method
• customer_entity: basic identity fields
• catalog_product_entity: sku, name
• quote: is_active, grand_total, customer_id
• quote_item: quote_id, product_id, qty, price
• report_viewed_product_index: product_id, store_id, added_at (each row = a view)`;

    return schemaInfo;
  } catch (error) {
    console.error('Error getting schema info:', error);
    return 'Unable to fetch schema information.';
  }
};

export const processChatbotQuery = async (userQuery: string): Promise<{
  response: string;
  sqlQuery?: string;
  data?: any[];
  error?: string;
}> => {
  if (!groqApiKey) {
    return {
      response: 'Chatbot functionality is temporarily unavailable because the GROQ_API_KEY is not configured. Please set the key in your environment and try again.',
      error: 'GROQ_API_KEY missing'
    };
  }

  try {
    // Get schema information
    const schemaInfo = await getSchemaInfo();

    // Create comprehensive system prompt
    const systemPrompt = `You are an expert MySQL assistant for an e-commerce dashboard. Generate a single best SQL SELECT query (no comments or markdown) that answers the user's request using this schema:

${schemaInfo}

Rules:
• Only SELECT queries; never modify data.
• Exclude canceled/closed orders (WHERE so.status NOT IN ('canceled','closed')).
• For revenue/sales calculations, use so.base_grand_total (not row_total) to match dashboard calculations.
• For product views, use report_viewed_product_index (each row represents a view; aggregate with COUNT(*) or COUNT(DISTINCT ...)).
• For cart abandonment metrics, compare active quotes (quote.is_active = 1) against orders joined by quote_id and treat quotes without completed orders as abandoned.
• Use short aliases (so, soi, soa, sop, ce, cpe).
• Use DATE() when filtering by day/month and add LIMIT (default 100).
• If the user is just greeting or asks for help navigating, respond with a friendly message instead of SQL.`;

    const userPrompt = `Convert this natural language query to SQL: "${userQuery}"`;

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.1,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: false
    });

    let sqlQuery = '';
    if (chatCompletion.choices && chatCompletion.choices[0]?.message?.content) {
      sqlQuery = chatCompletion.choices[0].message.content.trim();
    }

    // Check if response is actually SQL or just a message
    const isSQL = sqlQuery.toUpperCase().trim().startsWith('SELECT');

    if (!isSQL) {
      // It's a general response, not SQL
      return {
        response: sqlQuery,
        sqlQuery: undefined,
        data: undefined
      };
    }

    // Clean up SQL query (remove markdown code blocks if present)
    let cleanSQL = sqlQuery
      .replace(/```sql/gi, '')
      .replace(/```/g, '')
      .replace(/^SELECT/i, 'SELECT')  // Ensure it starts with SELECT
      .trim();

    // Safety check: ensure it's only a SELECT query
    const upperSQL = cleanSQL.toUpperCase().trim();
    if (!upperSQL.startsWith('SELECT') || 
        upperSQL.includes('INSERT') || 
        upperSQL.includes('UPDATE') || 
        upperSQL.includes('DELETE') || 
        upperSQL.includes('DROP') ||
        upperSQL.includes('ALTER') ||
        upperSQL.includes('TRUNCATE')) {
      return {
        response: 'I can only execute SELECT queries for safety reasons. Please ask for data retrieval queries only.',
        error: 'Invalid query type'
      };
    }

    // Execute the SQL query
    try {
      const results = await executeQuery<any>(cleanSQL);
      
      // Format response
      const rowCount = results.length;
      let response = '';

      if (rowCount === 0) {
        response = 'I couldn\'t find any matching records for that query.';
      } else {
        const firstRow = results[0];
        const columnCount = firstRow ? Object.keys(firstRow).length : 0;

        if (rowCount === 1 && columnCount <= 6) {
          // Provide a natural language summary for small aggregated results
          const parts = Object.entries(firstRow).map(([key, value]) => {
            const formattedValue = typeof value === 'number'
              ? Number.isInteger(value)
                ? value.toLocaleString()
                : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : value ?? 'null';
            return `${key.replace(/_/g, ' ')}: ${formattedValue}`;
          });
          response = `Here’s what I found:\n- ${parts.join('\n- ')}`;
        } else if (rowCount <= 10 && columnCount <= 10) {
          // Compact table-style summary
          const headers = Object.keys(firstRow);
          const rows = results.map(row =>
            headers.map(header => {
              const value = row[header];
              if (value === null || value === undefined) return '—';
              if (typeof value === 'number') {
                return Number.isInteger(value)
                  ? value.toLocaleString()
                  : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return String(value);
            })
          );

          const tableLines = [
            headers.join(' | '),
            headers.map(() => '---').join(' | '),
            ...rows.map(row => row.join(' | '))
          ];

          response = `✅ Found ${rowCount} result${rowCount !== 1 ? 's' : ''}.\n\n${tableLines.join('\n')}`;
        } else if (rowCount <= 10) {
          response = `✅ Found ${rowCount} result${rowCount !== 1 ? 's' : ''}.\n\n`;
          response += 'Here is a JSON preview:\n```\n';
          response += JSON.stringify(results, null, 2);
          response += '\n```';
        } else {
          response = `✅ Found ${rowCount} results. Showing a preview of the first 5 rows:\n\n`;
          response += '```\n';
          response += JSON.stringify(results.slice(0, 5), null, 2);
          response += '\n```';
          response += `\n\n... and ${rowCount - 5} more rows.`;
        }
      }

      return {
        response,
        sqlQuery: cleanSQL,
        data: results
      };
    } catch (sqlError: any) {
      return {
        response: `❌ SQL Error: ${sqlError.message}\n\nPlease try rephrasing your question or be more specific about what data you need.`,
        sqlQuery: cleanSQL,
        error: sqlError.message
      };
    }
  } catch (error: any) {
    console.error('Error processing chatbot query:', error);
    return {
      response: 'I apologize, but I encountered an error processing your query. Please try again or rephrase your question.',
      error: error.message
    };
  }
};

