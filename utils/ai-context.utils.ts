import { Page } from '@playwright/test';
import { SmartLogger } from './smart-logger.utils';

/**
 * AI Context Manager - Provides structured context for AI agents
 * Captures and formats information in AI-friendly formats
 */
export class AIContextManager {
  private static instance: AIContextManager;
  private contextHistory: AIContext[] = [];

  private constructor() {}

  static getInstance(): AIContextManager {
    if (!AIContextManager.instance) {
      AIContextManager.instance = new AIContextManager();
    }
    return AIContextManager.instance;
  }

  /**
   * Capture current page context for AI decision making
   */
  async capturePageContext(page: Page, operation: string): Promise<AIContext> {
    const context: AIContext = {
      timestamp: new Date().toISOString(),
      operation,
      url: page.url(),
      title: await page.title().catch(() => 'Unknown'),
      viewport: page.viewportSize(),
      availableElements: await this.getInteractableElements(page),
      pageStructure: await this.getPageStructure(page),
      userJourney: this.getCurrentUserJourney()
    };

    this.contextHistory.push(context);
    SmartLogger.log('INFO', 'AI Context captured', context);
    
    return context;
  }

  /**
   * Get interactable elements for AI agents
   */
  private async getInteractableElements(page: Page): Promise<ElementInfo[]> {
    try {
      return await page.evaluate(() => {
        const elements: ElementInfo[] = [];
        const interactableSelectors = [
          'button', 'a[href]', 'input', 'select', 'textarea',
          '[onclick]', '[role="button"]', '[role="link"]'
        ];

        interactableSelectors.forEach(selector => {
          const els = document.querySelectorAll(selector);
          els.forEach((el, index) => {
            if (el instanceof HTMLElement && el.offsetParent !== null) {
              elements.push({
                tagName: el.tagName.toLowerCase(),
                selector: selector,
                index,
                text: el.textContent?.trim().substring(0, 50) || '',
                id: el.id || '',
                className: el.className || '',
                type: el.getAttribute('type') || '',
                href: el.getAttribute('href') || '',
                role: el.getAttribute('role') || '',
                ariaLabel: el.getAttribute('aria-label') || '',
                dataTestId: el.getAttribute('data-testid') || '',
                visible: true,
                enabled: !(el as any).disabled
              });
            }
          });
        });

        return elements.slice(0, 50); // Limit for AI processing
      });
    } catch (error) {
      SmartLogger.log('WARN', 'Failed to capture interactable elements', { error: (error as Error).message });
      return [];
    }
  }

  /**
   * Get simplified page structure for AI understanding
   */
  private async getPageStructure(page: Page): Promise<PageStructure> {
    try {
      return await page.evaluate(() => {
        const structure: PageStructure = {
          forms: [],
          navigation: [],
          content: [],
          errors: []
        };

        // Forms
        document.querySelectorAll('form').forEach((form, index) => {
          structure.forms.push({
            index,
            action: form.action || '',
            method: form.method || 'GET',
            fields: Array.from(form.querySelectorAll('input, select, textarea')).map(field => ({
              name: field.getAttribute('name') || '',
              type: field.getAttribute('type') || 'text',
              required: field.hasAttribute('required'),
              placeholder: field.getAttribute('placeholder') || ''
            }))
          });
        });

        // Navigation
        document.querySelectorAll('nav a, .menu a, .navigation a').forEach((link, index) => {
          if (link instanceof HTMLAnchorElement) {
            structure.navigation.push({
              index,
              text: link.textContent?.trim() || '',
              href: link.href || '',
              active: link.classList.contains('active') || link.classList.contains('current')
            });
          }
        });

        // Content sections
        document.querySelectorAll('main, .content, .main-content, article').forEach((section, index) => {
          structure.content.push({
            index,
            tagName: section.tagName.toLowerCase(),
            className: section.className || '',
            headings: Array.from(section.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim() || '').slice(0, 5)
          });
        });

        // Error messages
        document.querySelectorAll('.error, .error-message, .alert-danger, [role="alert"]').forEach((error, index) => {
          structure.errors.push({
            index,
            text: error.textContent?.trim() || '',
            visible: (error as HTMLElement).offsetParent !== null
          });
        });

        return structure;
      });
    } catch (error) {
      SmartLogger.log('WARN', 'Failed to capture page structure', { error: (error as Error).message });
      return { forms: [], navigation: [], content: [], errors: [] };
    }
  }

  /**
   * Get current user journey context
   */
  private getCurrentUserJourney(): string[] {
    return this.contextHistory
      .slice(-5) // Last 5 operations
      .map(ctx => `${ctx.operation} on ${new URL(ctx.url).pathname}`)
      .filter((step, index, arr) => arr.indexOf(step) === index); // Remove duplicates
  }

  /**
   * Generate AI-friendly suggestions based on current context
   */
  generateAISuggestions(context: AIContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Form-based suggestions
    context.pageStructure.forms.forEach((form, index) => {
      if (form.fields.length > 0) {
        suggestions.push({
          type: 'form_interaction',
          priority: 'high',
          description: `Fill and submit form ${index + 1} with ${form.fields.length} fields`,
          selectors: form.fields.map(field => `[name="${field.name}"]`),
          testData: form.fields.map(field => ({
            field: field.name,
            type: field.type,
            sampleValue: this.generateSampleValue(field.type, field.name)
          }))
        });
      }
    });

    // Navigation suggestions
    context.pageStructure.navigation.forEach((nav, index) => {
      if (!nav.active) {
        suggestions.push({
          type: 'navigation',
          priority: 'medium',
          description: `Navigate to ${nav.text}`,
          selectors: [`a[href="${nav.href}"]`],
          expectedUrl: nav.href
        });
      }
    });

    // Error handling suggestions
    if (context.pageStructure.errors.length > 0) {
      suggestions.push({
        type: 'error_validation',
        priority: 'high',
        description: 'Validate error messages and handling',
        selectors: context.pageStructure.errors.map((_, index) => `.error:nth-child(${index + 1})`),
        validation: 'error_message_display'
      });
    }

    return suggestions.slice(0, 10); // Limit suggestions for AI processing
  }

  /**
   * Generate sample test data based on field type and name
   */
  private generateSampleValue(type: string, name: string): string {
    const patterns: { [key: string]: string } = {
      email: 'test@example.com',
      password: 'TestPass123!',
      username: 'testuser',
      phone: '+1234567890',
      url: 'https://example.com',
      date: '2025-01-01',
      number: '123',
      text: 'Sample text'
    };

    // Check field name patterns
    const lowerName = name.toLowerCase();
    if (lowerName.includes('email')) return patterns.email;
    if (lowerName.includes('pass')) return patterns.password;
    if (lowerName.includes('user')) return patterns.username;
    if (lowerName.includes('phone')) return patterns.phone;
    if (lowerName.includes('url')) return patterns.url;
    if (lowerName.includes('date')) return patterns.date;

    // Fallback to field type
    return patterns[type] || patterns.text;
  }

  /**
   * Export context for AI agent consumption
   */
  exportForAI(): AIExport {
    return {
      currentContext: this.contextHistory[this.contextHistory.length - 1],
      userJourney: this.getCurrentUserJourney(),
      availableActions: this.contextHistory[this.contextHistory.length - 1]?.availableElements || [],
      suggestions: this.contextHistory[this.contextHistory.length - 1] 
        ? this.generateAISuggestions(this.contextHistory[this.contextHistory.length - 1])
        : []
    };
  }

  /**
   * Clear context history
   */
  clearContext(): void {
    this.contextHistory = [];
    SmartLogger.log('INFO', 'AI Context history cleared');
  }
}

// Type definitions for AI context
export interface AIContext {
  timestamp: string;
  operation: string;
  url: string;
  title: string;
  viewport: { width: number; height: number } | null;
  availableElements: ElementInfo[];
  pageStructure: PageStructure;
  userJourney: string[];
}

export interface ElementInfo {
  tagName: string;
  selector: string;
  index: number;
  text: string;
  id: string;
  className: string;
  type: string;
  href: string;
  role: string;
  ariaLabel: string;
  dataTestId: string;
  visible: boolean;
  enabled: boolean;
}

export interface PageStructure {
  forms: FormInfo[];
  navigation: NavigationInfo[];
  content: ContentInfo[];
  errors: ErrorInfo[];
}

export interface FormInfo {
  index: number;
  action: string;
  method: string;
  fields: FieldInfo[];
}

export interface FieldInfo {
  name: string;
  type: string;
  required: boolean;
  placeholder: string;
}

export interface NavigationInfo {
  index: number;
  text: string;
  href: string;
  active: boolean;
}

export interface ContentInfo {
  index: number;
  tagName: string;
  className: string;
  headings: string[];
}

export interface ErrorInfo {
  index: number;
  text: string;
  visible: boolean;
}

export interface AISuggestion {
  type: 'form_interaction' | 'navigation' | 'error_validation' | 'content_verification';
  priority: 'high' | 'medium' | 'low';
  description: string;
  selectors: string[];
  testData?: any;
  expectedUrl?: string;
  validation?: string;
}

export interface AIExport {
  currentContext: AIContext;
  userJourney: string[];
  availableActions: ElementInfo[];
  suggestions: AISuggestion[];
}