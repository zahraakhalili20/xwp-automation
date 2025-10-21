import { test } from '@playwright/test';
import { TestUtils } from './test.utils';
import { ErrorInspector, PageInspectionReport } from './error-inspector.utils';

/**
 * Smart logging utility for enhanced test reporting
 * Provides structured logging with automatic categorization and context
 */
export class SmartLogger {
  private static logs: LogEntry[] = [];
  private static currentTest: string = '';

  /**
   * Initialize logger for a test
   */
  static initializeTest(testName: string): void {
    this.currentTest = testName;
    this.log('INFO', 'Test started', { testName });
  }

  /**
   * Main logging method with automatic categorization
   */
  static log(level: LogLevel, message: string, context?: any): void {
    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      testName: this.currentTest,
      context: context || {},
      category: this.categorizeLog(message, level),
      tags: this.generateTags(message, level, context)
    };

    this.logs.push(entry);
    
    // Also log to console with formatting
    this.formatConsoleOutput(entry);
  }

  /**
   * Log user actions for step-by-step tracking
   */
  static logUserAction(action: string, element?: string, value?: string): void {
    this.log('ACTION', `User ${action}`, {
      element,
      value: value ? this.sanitizeValue(value) : undefined,
      step: this.getCurrentStepNumber()
    });
  }

  /**
   * Log page navigation
   */
  static logNavigation(from: string, to: string, loadTime?: number): void {
    this.log('NAVIGATION', `Navigated from ${from} to ${to}`, {
      from,
      to,
      loadTime,
      performance: loadTime ? this.categorizePerformance(loadTime) : undefined
    });
  }

  /**
   * Log API calls and responses
   */
  static logApiCall(method: string, url: string, status: number, responseTime?: number): void {
    const level: LogLevel = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'INFO';
    this.log(level, `API ${method} ${url} - ${status}`, {
      method,
      url,
      status,
      responseTime,
      success: status < 400
    });
  }

  /**
   * Log assertions with expected vs actual values
   */
  static logAssertion(description: string, expected: any, actual: any, passed: boolean): void {
    const level: LogLevel = passed ? 'PASS' : 'FAIL';
    this.log(level, `Assertion: ${description}`, {
      expected,
      actual,
      passed,
      comparison: this.generateComparison(expected, actual)
    });
  }

  /**
   * Log errors with automatic page inspection
   */
  static async logError(error: Error, page?: any, autoInspect: boolean = true): Promise<void> {
    const errorContext: any = {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
      testName: this.currentTest
    };

    let pageInspection: PageInspectionReport | undefined;
    
    if (page && autoInspect) {
      try {
        const inspector = new ErrorInspector(page);
        pageInspection = await inspector.inspectPageOnError(error.message);
        
        // Add smart suggestions to the log
        const suggestions = ErrorInspector.generateFailureSuggestions(pageInspection);
        errorContext.suggestions = suggestions;
        errorContext.pageInspection = {
          url: pageInspection.url,
          title: pageInspection.title,
          screenshot: pageInspection.screenshot,
          errorElements: Object.keys(pageInspection.elements).filter(key => 
            key.includes('error') && pageInspection!.elements[key].visible
          ),
          blockingElements: pageInspection.blockingElements?.length || 0
        };
      } catch (inspectionError) {
        errorContext.inspectionError = (inspectionError as Error).message;
      }
    }

    this.log('ERROR', error.message, errorContext);
  }

  /**
   * Log performance metrics
   */
  static logPerformance(metric: string, value: number, threshold?: number): void {
    const level: LogLevel = threshold && value > threshold ? 'WARN' : 'INFO';
    const category = this.categorizePerformance(value);
    
    this.log(level, `Performance: ${metric} = ${value}ms`, {
      metric,
      value,
      threshold,
      category,
      withinThreshold: !threshold || value <= threshold
    });
  }

  /**
   * Log waiting operations
   */
  static logWait(waitType: string, selector?: string, timeout?: number, success?: boolean): void {
    const level: LogLevel = success === false ? 'WARN' : 'INFO';
    this.log(level, `Wait: ${waitType}`, {
      waitType,
      selector,
      timeout,
      success
    });
  }

  /**
   * Generate test summary with smart insights
   */
  static generateTestSummary(): TestSummary {
    const testLogs = this.logs.filter(log => log.testName === this.currentTest);
    
    const summary: TestSummary = {
      testName: this.currentTest,
      totalLogs: testLogs.length,
      logsByLevel: this.groupLogsByLevel(testLogs),
      logsByCategory: this.groupLogsByCategory(testLogs),
      timeline: this.generateTimeline(testLogs),
      insights: this.generateInsights(testLogs),
      suggestions: this.generateSuggestions(testLogs),
      performance: this.summarizePerformance(testLogs),
      errors: testLogs.filter(log => log.level === 'ERROR'),
      warnings: testLogs.filter(log => log.level === 'WARN')
    };

    return summary;
  }

  /**
   * Export logs for external reporting tools
   */
  static exportForReporting(): AllureAttachment[] {
    const attachments: AllureAttachment[] = [];
    
    // Create structured log attachment
    attachments.push({
      name: '📋 Detailed Test Logs',
      content: JSON.stringify(this.logs, null, 2),
      type: 'application/json'
    });

    // Create human-readable summary
    const summary = this.generateTestSummary();
    attachments.push({
      name: '📊 Test Execution Summary',
      content: JSON.stringify(summary, null, 2),
      type: 'application/json'
    });

    // Create timeline HTML for visualization
    attachments.push({
      name: '⏱️ Test Timeline Visualization',
      content: this.generateTimelineHTML(summary.timeline),
      type: 'text/html'
    });

    // Create step-by-step action log for Allure
    const actionLog = this.generateActionSteps();
    attachments.push({
      name: '👆 User Actions Log',
      content: actionLog,
      type: 'text/plain'
    });

    // Create error analysis if any errors occurred
    if (summary.errors.length > 0) {
      const errorAnalysis = this.generateErrorAnalysis(summary.errors);
      attachments.push({
        name: '🔍 Error Analysis & Suggestions',
        content: errorAnalysis,
        type: 'text/markdown'
      });
    }

    // Create performance report
    if (summary.performance.totalMeasurements > 0) {
      const perfReport = this.generatePerformanceReport(summary.performance);
      attachments.push({
        name: '⚡ Performance Metrics',
        content: perfReport,
        type: 'text/plain'
      });
    }

    return attachments;
  }

  /**
   * Clear logs for the current test
   */
  static clearTestLogs(): void {
    this.logs = this.logs.filter(log => log.testName !== this.currentTest);
  }

  /**
   * Helper methods
   */
  private static generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static categorizeLog(message: string, level: LogLevel): LogCategory {
    const msg = message.toLowerCase();
    
    if (msg.includes('click') || msg.includes('type') || msg.includes('select')) return 'USER_ACTION';
    if (msg.includes('navigate') || msg.includes('page') || msg.includes('url')) return 'NAVIGATION';
    if (msg.includes('api') || msg.includes('request') || msg.includes('response')) return 'API';
    if (msg.includes('assert') || msg.includes('expect') || msg.includes('verify')) return 'ASSERTION';
    if (msg.includes('wait') || msg.includes('timeout')) return 'TIMING';
    if (msg.includes('performance') || msg.includes('load') || msg.includes('speed')) return 'PERFORMANCE';
    if (level === 'ERROR' || level === 'FAIL') return 'ERROR';
    
    return 'GENERAL';
  }

  private static generateTags(message: string, level: LogLevel, context?: any): string[] {
    const tags: string[] = [level.toLowerCase()];
    
    if (context?.element) tags.push('element-interaction');
    if (context?.api) tags.push('api-call');
    if (context?.performance) tags.push('performance');
    if (context?.suggestions) tags.push('auto-diagnosed');
    if (message.includes('screenshot')) tags.push('visual');
    
    return tags;
  }

  private static formatConsoleOutput(entry: LogEntry): void {
    const emoji = this.getLevelEmoji(entry.level);
    // entry.timestamp is now a proper ISO string
    const timestamp = this.formatTimestampForDisplay(entry.timestamp);
    
    console.log(`${emoji} [${timestamp}] ${entry.message}`);
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('   Context:', entry.context);
    }
  }

  /**
   * Format timestamp string for console display
   */
  private static formatTimestampForDisplay(timestampString: string): string {
    try {
      // timestampString is now a proper ISO string, so this should work correctly
      return new Date(timestampString).toLocaleTimeString();
    } catch (error) {
      // Fallback: just return the original timestamp string
      return timestampString;
    }
  }

  private static getLevelEmoji(level: LogLevel): string {
    const emojis = {
      'INFO': 'ℹ️',
      'WARN': '⚠️',
      'ERROR': '❌',
      'DEBUG': '🐛',
      'ACTION': '👆',
      'NAVIGATION': '🧭',
      'PASS': '✅',
      'FAIL': '❌'
    };
    return emojis[level] || 'ℹ️';
  }

  private static getCurrentStepNumber(): number {
    return this.logs.filter(log => log.testName === this.currentTest && log.level === 'ACTION').length + 1;
  }

  private static sanitizeValue(value: string): string {
    // Hide sensitive information like passwords
    if (value.toLowerCase().includes('password') || value.length > 6) {
      return '*'.repeat(value.length);
    }
    return value;
  }

  private static categorizePerformance(time: number): string {
    if (time < 1000) return 'fast';
    if (time < 3000) return 'moderate';
    if (time < 5000) return 'slow';
    return 'very-slow';
  }

  private static generateComparison(expected: any, actual: any): string {
    if (typeof expected === typeof actual) {
      return `Expected: ${expected}, Actual: ${actual}`;
    }
    return `Type mismatch - Expected: ${typeof expected}(${expected}), Actual: ${typeof actual}(${actual})`;
  }

  private static groupLogsByLevel(logs: LogEntry[]): {[key: string]: number} {
    return logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as {[key: string]: number});
  }

  private static groupLogsByCategory(logs: LogEntry[]): {[key: string]: number} {
    return logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as {[key: string]: number});
  }

  private static generateTimeline(logs: LogEntry[]): TimelineEntry[] {
    return logs.map(log => ({
      timestamp: log.timestamp,
      message: log.message,
      level: log.level,
      category: log.category,
      duration: 0 // Could be calculated if we track start/end times
    }));
  }

  private static generateInsights(logs: LogEntry[]): string[] {
    const insights: string[] = [];
    const errors = logs.filter(log => log.level === 'ERROR');
    const warnings = logs.filter(log => log.level === 'WARN');
    const actions = logs.filter(log => log.level === 'ACTION');
    
    if (errors.length > 0) {
      insights.push(`Test encountered ${errors.length} error(s) - review error logs for details`);
    }
    
    if (warnings.length > 3) {
      insights.push(`High number of warnings (${warnings.length}) - may indicate unstable test conditions`);
    }
    
    if (actions.length > 20) {
      insights.push(`Complex test with ${actions.length} user actions - consider breaking into smaller tests`);
    }

    return insights;
  }

  private static generateSuggestions(logs: LogEntry[]): string[] {
    const suggestions: string[] = [];
    
    // Collect suggestions from error logs
    logs.filter(log => log.context?.suggestions).forEach(log => {
      suggestions.push(...log.context.suggestions);
    });

    return Array.from(new Set(suggestions)); // Remove duplicates
  }

  private static summarizePerformance(logs: LogEntry[]): PerformanceSummary {
    const perfLogs = logs.filter(log => log.category === 'PERFORMANCE');
    const times = perfLogs.map(log => log.context?.value || 0).filter(t => t > 0);
    
    return {
      totalMeasurements: perfLogs.length,
      averageTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      slowestOperation: Math.max(...times, 0),
      fastestOperation: times.length > 0 ? Math.min(...times) : 0,
      timeouts: logs.filter(log => log.message.includes('timeout')).length
    };
  }

  private static generateTimelineHTML(timeline: TimelineEntry[]): string {
    // Generate a simple HTML timeline visualization
    const items = timeline.map(entry => `
      <div class="timeline-item ${entry.level.toLowerCase()}">
        <span class="timestamp">${entry.timestamp}</span>
        <span class="level">${entry.level}</span>
        <span class="message">${entry.message}</span>
      </div>
    `).join('');

    return `
      <html>
        <head>
          <title>Test Timeline</title>
          <style>
            .timeline-item { margin: 5px 0; padding: 10px; border-left: 3px solid #ccc; }
            .error { border-left-color: #ff0000; background-color: #ffe6e6; }
            .warn { border-left-color: #ffa500; background-color: #fff3e0; }
            .info { border-left-color: #0066cc; background-color: #e6f3ff; }
            .timestamp { font-weight: bold; margin-right: 10px; }
            .level { display: inline-block; width: 80px; margin-right: 10px; }
          </style>
        </head>
        <body>
          <h1>Test Timeline</h1>
          ${items}
        </body>
      </html>
    `;
  }

  /**
   * Generate action steps for Allure step visualization
   */
  private static generateActionSteps(): string {
    const actionLogs = this.logs.filter(log => log.level === 'ACTION');
    const steps = actionLogs.map((log, index) => {
      const step = `Step ${index + 1}: ${log.message}`;
      const details = log.context?.element ? `  Element: ${log.context.element}` : '';
      const value = log.context?.value ? `  Value: ${log.context.value}` : '';
      return `${step}\n${details}${value ? '\n' + value : ''}`;
    }).join('\n\n');

    return `USER ACTIONS PERFORMED:\n\n${steps}`;
  }

  /**
   * Generate error analysis report for Allure
   */
  private static generateErrorAnalysis(errors: LogEntry[]): string {
    const analysis = errors.map(error => {
      const suggestions = error.context?.suggestions || [];
      const pageInfo = error.context?.pageInspection || {};
      
      return `## Error: ${error.message}

**Context:**
- URL: ${pageInfo.url || 'Unknown'}
- Screenshot: ${pageInfo.screenshot || 'Not captured'}
- Error Elements: ${pageInfo.errorElements?.length || 0} found
- Blocking Elements: ${pageInfo.blockingElements || 0} detected

**Smart Suggestions:**
${suggestions.map((s: string) => `- ${s}`).join('\n')}

**Stack Trace:**
\`\`\`
${error.context?.stack?.join('\n') || 'No stack trace available'}
\`\`\`
`;
    }).join('\n\n---\n\n');

    return analysis;
  }

  /**
   * Generate performance report for Allure
   */
  private static generatePerformanceReport(performance: PerformanceSummary): string {
    return `PERFORMANCE METRICS:

Total Measurements: ${performance.totalMeasurements}
Average Time: ${performance.averageTime.toFixed(2)}ms
Fastest Operation: ${performance.fastestOperation}ms
Slowest Operation: ${performance.slowestOperation}ms
Timeouts Encountered: ${performance.timeouts}

PERFORMANCE RATING: ${performance.averageTime < 1000 ? '🟢 Excellent' : 
                      performance.averageTime < 3000 ? '🟡 Good' : 
                      performance.averageTime < 5000 ? '🟠 Slow' : '🔴 Poor'}`;
  }
}

// Type definitions
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'ACTION' | 'NAVIGATION' | 'PASS' | 'FAIL';
type LogCategory = 'USER_ACTION' | 'NAVIGATION' | 'API' | 'ASSERTION' | 'TIMING' | 'PERFORMANCE' | 'ERROR' | 'GENERAL';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  testName: string;
  context: any;
  category: LogCategory;
  tags: string[];
}

interface TestSummary {
  testName: string;
  totalLogs: number;
  logsByLevel: {[key: string]: number};
  logsByCategory: {[key: string]: number};
  timeline: TimelineEntry[];
  insights: string[];
  suggestions: string[];
  performance: PerformanceSummary;
  errors: LogEntry[];
  warnings: LogEntry[];
}

interface TimelineEntry {
  timestamp: string;
  message: string;
  level: LogLevel;
  category: LogCategory;
  duration: number;
}

interface PerformanceSummary {
  totalMeasurements: number;
  averageTime: number;
  slowestOperation: number;
  fastestOperation: number;
  timeouts: number;
}

interface AllureAttachment {
  name: string;
  content: string;
  type: string;
}