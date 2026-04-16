#!/usr/bin/env node

/**
 * Agentic Testing System - Main Orchestrator
 * Coordinates the 5-agent system for automated web testing
 */

const UrlCollectorAgent = require('./agents/UrlCollectorAgent');
const WebAnalyzerAgent = require('./agents/WebAnalyzerAgent');
const CypressTestCreatorAgent = require('./agents/CypressTestCreatorAgent');
const TestRunnerAgent = require('./agents/TestRunnerAgent');
const ReportGeneratorAgent = require('./agents/ReportGeneratorAgent');

class AgenticTestingSystem {
  constructor() {
    this.agents = {};
    this.agentChain = null;
    this.initializeAgents();
  }

  /**
   * Initialize all agents and create the processing chain
   */
  initializeAgents() {
    console.log('🤖 Initializing Agentic Testing System...');

    // Create agents in reverse order (last agent first)
    this.agents.reportGenerator = new ReportGeneratorAgent();
    this.agents.testRunner = new TestRunnerAgent(this.agents.reportGenerator);
    this.agents.testCreator = new CypressTestCreatorAgent(this.agents.testRunner);
    this.agents.webAnalyzer = new WebAnalyzerAgent(this.agents.testCreator);
    this.agents.urlCollector = new UrlCollectorAgent(this.agents.webAnalyzer);

    // Set the main entry point
    this.agentChain = this.agents.urlCollector;

    console.log('✅ All agents initialized and chained');
    console.log('🔗 Agent Chain: URL Collector → Web Analyzer → Test Creator → Test Runner → Report Generator');
  }

  /**
   * Start the agentic testing process
   */
  async start() {
    try {
      console.log('\n🚀 Starting Agentic Testing System...\n');

      const result = await this.agentChain.execute();

      console.log('\n🎉 Testing process completed successfully!');
      console.log('📄 Check the reports directory for detailed results');

      return result;

    } catch (error) {
      console.error('\n❌ Testing process failed:', error.message);
      console.error('Stack trace:', error.stack);

      // Generate error report
      await this.generateErrorReport(error);

      throw error;
    }
  }

  /**
   * Generate an error report when the system fails
   * @param {Error} error - The error that occurred
   */
  async generateErrorReport(error) {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const errorReport = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          cwd: process.cwd()
        }
      };

      const reportsDir = path.join(process.cwd(), 'reports');
      await fs.mkdir(reportsDir, { recursive: true });

      const filename = `error-report-${Date.now()}.json`;
      const errorPath = path.join(reportsDir, filename);

      await fs.writeFile(errorPath, JSON.stringify(errorReport, null, 2));

      console.log(`📄 Error report saved to: ${errorPath}`);

    } catch (reportError) {
      console.error('Failed to generate error report:', reportError.message);
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      initialized: true,
      agents: Object.keys(this.agents),
      agentChain: 'URL Collector → Web Analyzer → Test Creator → Test Runner → Report Generator'
    };
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const system = new AgenticTestingSystem();
    await system.start();
  } catch (error) {
    console.error('\n💥 Fatal error in Agentic Testing System');
    process.exit(1);
  }
}

// Export for testing or programmatic use
module.exports = AgenticTestingSystem;

// Run if called directly
if (require.main === module) {
  main();
}