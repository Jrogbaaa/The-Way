import { AIPlugin, AIPluginRegistry } from '../types';

/**
 * Plugin Registry for managing AI plugins
 * This makes the application extensible for future AI models and tools
 */
class PluginRegistry implements AIPluginRegistry {
  plugins: Record<string, AIPlugin> = {};

  /**
   * Register a new plugin
   */
  register(plugin: AIPlugin): void {
    if (this.plugins[plugin.id]) {
      console.warn(`Plugin with ID ${plugin.id} already exists and will be overwritten.`);
    }
    this.plugins[plugin.id] = plugin;
    console.log(`Plugin "${plugin.name}" (${plugin.id}) registered successfully.`);
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    if (this.plugins[pluginId]) {
      delete this.plugins[pluginId];
      console.log(`Plugin with ID ${pluginId} unregistered successfully.`);
    } else {
      console.warn(`Plugin with ID ${pluginId} not found.`);
    }
  }

  /**
   * Get a plugin by ID
   */
  get(pluginId: string): AIPlugin | undefined {
    return this.plugins[pluginId];
  }

  /**
   * List all registered plugins
   */
  list(): AIPlugin[] {
    return Object.values(this.plugins);
  }

  /**
   * List plugins by type
   */
  listByType(type: AIPlugin['type']): AIPlugin[] {
    return Object.values(this.plugins).filter(plugin => plugin.type === type);
  }

  /**
   * Check if a plugin exists
   */
  exists(pluginId: string): boolean {
    return !!this.plugins[pluginId];
  }
}

// Create a singleton instance of the registry
export const pluginRegistry = new PluginRegistry();

/**
 * Register a basic model plugin
 */
export const registerModelPlugin = (
  id: string,
  name: string,
  description: string,
  handler: (input: any) => Promise<any>,
  metadata?: Record<string, any>
): void => {
  pluginRegistry.register({
    id,
    name,
    version: '1.0.0',
    description,
    type: 'model',
    entrypoint: () => handler,
    metadata,
  });
};

/**
 * Register a tool plugin
 */
export const registerToolPlugin = (
  id: string,
  name: string,
  description: string,
  handler: (input: any) => Promise<any>,
  metadata?: Record<string, any>
): void => {
  pluginRegistry.register({
    id,
    name,
    version: '1.0.0',
    description,
    type: 'tool',
    entrypoint: () => handler,
    metadata,
  });
};

/**
 * Execute a plugin with given input
 */
export const executePlugin = async (pluginId: string, input: any): Promise<any> => {
  const plugin = pluginRegistry.get(pluginId);
  if (!plugin) {
    throw new Error(`Plugin with ID ${pluginId} not found.`);
  }
  
  try {
    const handler = plugin.entrypoint();
    return await handler(input);
  } catch (error) {
    console.error(`Error executing plugin ${pluginId}:`, error);
    throw error;
  }
};

export default pluginRegistry; 