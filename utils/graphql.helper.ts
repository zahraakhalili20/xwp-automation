/**
 * GraphQL Helper for API validation and data verification
 * Provides methods to execute GraphQL queries and validate frontend data
 */

export interface GraphQLConfig {
  endpoint: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface QueryResult<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export class GraphQLHelper {
  private endpoint: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(config: string | GraphQLConfig) {
    if (typeof config === 'string') {
      this.endpoint = config;
      this.defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      this.timeout = 30000;
    } else {
      this.endpoint = config.endpoint;
      this.defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers
      };
      this.timeout = config.timeout || 30000;
    }
  }

  /**
   * Execute GraphQL query from file
   * @param queryName - Name of the query file (without .gql extension)
   * @param variables - Variables for the query
   * @param headers - Additional headers for this request
   * @returns Promise with query result
   */
  async executeQuery<T = any>(
    queryName: string, 
    variables: Record<string, any> = {},
    headers: Record<string, string> = {}
  ): Promise<T> {
    const query = await this.loadQuery(queryName);
    const result = await this.makeRequest<T>(query, variables, headers);
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL Error: ${result.errors.map(e => e.message).join(', ')}`);
    }
    
    return result.data as T;
  }

  /**
   * Execute raw GraphQL query string
   * @param query - GraphQL query string
   * @param variables - Variables for the query
   * @param headers - Additional headers for this request
   * @returns Promise with query result
   */
  async executeRawQuery<T = any>(
    query: string,
    variables: Record<string, any> = {},
    headers: Record<string, string> = {}
  ): Promise<T> {
    const result = await this.makeRequest<T>(query, variables, headers);
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL Error: ${result.errors.map(e => e.message).join(', ')}`);
    }
    
    return result.data as T;
  }

  /**
   * Load GraphQL query from file
   * @param queryName - Name of the query file
   * @returns GraphQL query string
   */
  private async loadQuery(queryName: string): Promise<string> {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Try different folders in order
    const queryPaths = [
      path.resolve(`graphql/queries/${queryName}.gql`),
      path.resolve(`graphql/mutations/${queryName}.gql`),
      path.resolve(`graphql/subscriptions/${queryName}.gql`),
      path.resolve(`graphql/${queryName}.gql`)
    ];
    
    for (const queryPath of queryPaths) {
      try {
        const content = await fs.readFile(queryPath, 'utf8');
        
        // Check if it's a placeholder file
        if (content.includes('# PLACEHOLDER:')) {
          throw new Error(`GraphQL query '${queryName}' is a placeholder. Please provide the actual query.`);
        }
        
        return content;
      } catch (error) {
        if ((error as any).code !== 'ENOENT') {
          throw error; // Re-throw non "file not found" errors
        }
        continue;
      }
    }
    
    // Create placeholder file and throw error
    await this.createPlaceholderQuery(queryName);
    throw new Error(`GraphQL query '${queryName}' not found. Placeholder created - please provide the query.`);
  }

  /**
   * Create placeholder query file
   * @param queryName - Name of the query
   */
  private async createPlaceholderQuery(queryName: string): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const graphqlDir = path.resolve('graphql/queries');
    const filePath = path.resolve(graphqlDir, `${queryName}.gql`);
    
    // Create directory if it doesn't exist
    await fs.mkdir(graphqlDir, { recursive: true });
    
    const placeholder = `# PLACEHOLDER: GraphQL Query for ${queryName}
# 
# Please replace this comment with your GraphQL query.
# 
# Example for Query:
# query ${this.toPascalCase(queryName)}($id: ID!) {
#   ${this.toCamelCase(queryName)}(id: $id) {
#     id
#     # Add your fields here
#   }
# }
#
# Example for Mutation:
# mutation ${this.toPascalCase(queryName)}($input: ${this.toPascalCase(queryName)}Input!) {
#   ${this.toCamelCase(queryName)}(input: $input) {
#     id
#     # Add your response fields here
#   }
# }
#
# Variables expected: { /* Define expected variables here */ }
# Usage: await graphql.executeQuery('${queryName}', { /* variables */ });
`;

    await fs.writeFile(filePath, placeholder, 'utf8');
  }

  /**
   * Make HTTP request to GraphQL endpoint
   * @private
   */
  private async makeRequest<T>(
    query: string,
    variables: Record<string, any>,
    additionalHeaders: Record<string, string>
  ): Promise<QueryResult<T>> {
    const headers = { ...this.defaultHeaders, ...additionalHeaders };
    
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Validate frontend data against GraphQL response
   * @param frontendData - Data from frontend UI
   * @param gqlData - Data from GraphQL API
   * @param fields - Fields to compare (supports nested paths like 'user.profile.name')
   * @returns Boolean indicating if all fields match
   */
  validateFrontendData(
    frontendData: any, 
    gqlData: any, 
    fields: string[]
  ): boolean {
    const mismatches: string[] = [];
    
    for (const field of fields) {
      const frontendValue = this.getNestedValue(frontendData, field);
      const gqlValue = this.getNestedValue(gqlData, field);
      
      if (!this.deepEqual(frontendValue, gqlValue)) {
        mismatches.push(`${field}: frontend="${frontendValue}" vs gql="${gqlValue}"`);
      }
    }
    
    if (mismatches.length > 0) {
      console.warn('Frontend-GraphQL data mismatches:', mismatches);
      return false;
    }
    
    return true;
  }

  /**
   * Get nested value from object using dot notation
   * @private
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) return current;
      return current[key];
    }, obj);
  }

  /**
   * Deep equality check for values
   * @private
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }
    
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.deepEqual(a[key], b[key]));
    }
    
    return false;
  }

  /**
   * Convert string to PascalCase
   * @private
   */
  private toPascalCase(str: string): string {
    return str.replace(/(\w)(\w*)/g, (_, first, rest) => 
      first.toUpperCase() + rest.toLowerCase()
    ).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Convert string to camelCase
   * @private
   */
  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Set authentication headers for subsequent requests
   * @param token - Authentication token
   * @param type - Token type (Bearer, etc.)
   */
  setAuthToken(token: string, type: string = 'Bearer'): void {
    this.defaultHeaders['Authorization'] = `${type} ${token}`;
  }

  /**
   * Remove authentication headers
   */
  clearAuth(): void {
    delete this.defaultHeaders['Authorization'];
  }
}