/**
 * Base Agent class for the agentic testing system
 */
class BaseAgent {
  constructor(name, nextAgent = null) {
    this.name = name;
    this.nextAgent = nextAgent;
  }

  /**
   * Execute the agent's task
   * @param {any} input - Input data for the agent
   * @returns {Promise<any>} - Output data to pass to next agent
   */
  async execute(input) {
    throw new Error('execute method must be implemented by subclass');
  }

  /**
   * Pass data to the next agent in the chain
   * @param {any} data - Data to pass to next agent
   */
  async passToNext(data) {
    if (this.nextAgent) {
      console.log(`🔄 ${this.name} passing data to ${this.nextAgent.name}`);
      return await this.nextAgent.execute(data);
    }
    return data;
  }

  /**
   * Log agent activity
   * @param {string} message - Message to log
   */
  log(message) {
    console.log(`🤖 ${this.name}: ${message}`);
  }
}

module.exports = BaseAgent;