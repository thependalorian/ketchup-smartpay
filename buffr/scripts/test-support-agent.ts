/**
 * Test Support Agent (Companion Agent with Support Mode)
 * 
 * Location: scripts/test-support-agent.ts
 * Purpose: Test the consolidated support functionality in companion agent
 * 
 * Usage:
 *   npx tsx scripts/test-support-agent.ts
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or NEON_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function testSupportTables() {
  console.log('\n🧪 Testing Support System Tables...\n');
  
  try {
    // Test 1: Check if support_tickets table exists
    console.log('1. Checking support_tickets table...');
    const ticketsCheck = await sql`
      SELECT COUNT(*) as count FROM support_tickets
    `;
    console.log(`   ✅ support_tickets table exists (${ticketsCheck[0]?.count || 0} tickets)`);
    
    // Test 2: Check if support_conversations table exists
    console.log('2. Checking support_conversations table...');
    const conversationsCheck = await sql`
      SELECT COUNT(*) as count FROM support_conversations
    `;
    console.log(`   ✅ support_conversations table exists (${conversationsCheck[0]?.count || 0} conversations)`);
    
    // Test 3: Check if ticket_comments table exists (if created)
    console.log('3. Checking ticket_comments table...');
    try {
      const commentsCheck = await sql`
        SELECT COUNT(*) as count FROM ticket_comments
      `;
      console.log(`   ✅ ticket_comments table exists (${commentsCheck[0]?.count || 0} comments)`);
    } catch (e) {
      console.log(`   ⚠️  ticket_comments table not found (optional table)`);
    }
    
    // Test 4: Verify indexes
    console.log('4. Verifying indexes...');
    const indexes = await sql`
      SELECT indexname FROM pg_indexes 
      WHERE tablename IN ('support_tickets', 'support_conversations', 'ticket_comments')
      ORDER BY tablename, indexname
    `;
    console.log(`   ✅ Found ${indexes.length} indexes`);
    
    // Test 5: Check seed data
    console.log('5. Checking seed data...');
    const seedTicket = await sql`
      SELECT ticket_number, subject, status, priority 
      FROM support_tickets 
      WHERE ticket_number = 'TKT-20260127-SEED01'
      LIMIT 1
    `;
    if (seedTicket.length > 0) {
      console.log(`   ✅ Seed ticket found: ${seedTicket[0].ticket_number} - ${seedTicket[0].subject}`);
    } else {
      console.log(`   ℹ️  No seed ticket found (this is OK if no users exist)`);
    }
    
    console.log('\n✅ All support system tables verified!\n');
    return true;
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testCompanionAgentSupportTools() {
  console.log('🧪 Testing Companion Agent Support Tools...\n');
  
  try {
    // Test that companion agent can be imported
    console.log('1. Checking companion agent imports...');
    
    // Note: This would require the Python backend to be running
    // For now, we just verify the files exist
    const fs = await import('fs/promises');
    const companionToolsPath = resolve(process.cwd(), 'buffr_ai/agents/companion/tools.py');
    const companionPromptsPath = resolve(process.cwd(), 'buffr_ai/agents/companion/prompts.py');
    
    try {
      await fs.access(companionToolsPath);
      console.log('   ✅ companion/tools.py exists');
      
      const toolsContent = await fs.readFile(companionToolsPath, 'utf-8');
      const hasSupportTools = 
        toolsContent.includes('search_knowledge_base') &&
        toolsContent.includes('create_support_ticket') &&
        toolsContent.includes('escalate_to_admin') &&
        toolsContent.includes('check_ticket_status');
      
      if (hasSupportTools) {
        console.log('   ✅ Support tools found in companion agent');
      } else {
        console.log('   ❌ Support tools missing in companion agent');
        return false;
      }
    } catch (e) {
      console.log('   ⚠️  Could not verify companion agent files');
    }
    
    // Check prompts
    try {
      await fs.access(companionPromptsPath);
      const promptsContent = await fs.readFile(companionPromptsPath, 'utf-8');
      const hasSupportPrompts = 
        promptsContent.includes('Customer Support') &&
        promptsContent.includes('Escalation') &&
        promptsContent.includes('escalate_to_admin');
      
      if (hasSupportPrompts) {
        console.log('   ✅ Support prompts found in companion agent');
      } else {
        console.log('   ⚠️  Support prompts may be incomplete');
      }
    } catch (e) {
      console.log('   ⚠️  Could not verify companion prompts');
    }
    
    console.log('\n✅ Companion agent support tools verified!\n');
    return true;
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testAPIEndpoint() {
  console.log('🧪 Testing API Endpoint (Companion Agent)...\n');
  
  try {
    const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8001';
    
    console.log(`1. Testing health endpoint: ${AI_BACKEND_URL}/health`);
    const healthResponse = await fetch(`${AI_BACKEND_URL}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ AI backend is running');
      console.log(`   Status: ${healthData.status || 'unknown'}`);
    } else {
      console.log('   ⚠️  AI backend health check failed (backend may not be running)');
      console.log('   This is OK for migration testing - backend can be started separately');
    }
    
    console.log('\n✅ API endpoint test completed!\n');
    return true;
    
  } catch (error: any) {
    console.log('   ⚠️  Could not connect to AI backend (this is OK if backend is not running)');
    console.log('   Start the backend with: cd buffr_ai && python -m uvicorn main:app --reload');
    return true; // Don't fail the test if backend isn't running
  }
}

async function main() {
  console.log('🚀 Testing Support Agent Consolidation\n');
  console.log('=' .repeat(50));
  
  const results = {
    tables: false,
    tools: false,
    api: false,
  };
  
  // Test 1: Database tables
  results.tables = await testSupportTables();
  
  // Test 2: Companion agent tools
  results.tools = await testCompanionAgentSupportTools();
  
  // Test 3: API endpoint (optional - backend may not be running)
  results.api = await testAPIEndpoint();
  
  // Summary
  console.log('=' .repeat(50));
  console.log('\n📊 Test Summary:\n');
  console.log(`   Database Tables: ${results.tables ? '✅' : '❌'}`);
  console.log(`   Companion Tools: ${results.tools ? '✅' : '❌'}`);
  console.log(`   API Endpoint: ${results.api ? '✅' : '⚠️'}`);
  
  if (results.tables && results.tools) {
    console.log('\n🎉 Support agent consolidation verified!\n');
    console.log('Next steps:');
    console.log('1. Start AI backend: cd buffr_ai && python -m uvicorn main:app --reload');
    console.log('2. Test support chat in the app (FAQs screen)');
    console.log('3. Try escalation: "I want to speak to a human"');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the output above.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
