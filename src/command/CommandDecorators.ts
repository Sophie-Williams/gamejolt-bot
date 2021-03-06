import { Message } from 'gamejolt.js';

import { Command } from './Command';
import { Middleware } from '../types/Middleware';

/**
 * Set Command 'name' property metadata.
 * @param value The passed name value to set.
 */
export function name(value: string): ClassDecorator {
  return _setMetaData('name', value);
}

/**
 * Set Command 'description' property metadata
 * @param value The passed description value to set.
 */
export function description(value: string): ClassDecorator {
  return _setMetaData('description', value);
}

/**
 * Set Command 'aliases' property metadata.
 * @param value The passed aliases values to set.
 */
export function aliases(...value: string[]): ClassDecorator {
  return _setMetaData('aliases', value);
}

/**
 * Set Command 'usage' property metadata
 * @param value The passed usage value to set.
 */
export function usage(value: string): ClassDecorator {
  return _setMetaData('usage', value);
}

/**
 * Middleware decorator.
 * @param func The middleware function.
 */
export function using(func: Middleware): MethodDecorator {
  return function(
    target: Command,
    key: string,
    propertyDescriptor: PropertyDescriptor
  ): PropertyDescriptor {
    if (!propertyDescriptor) propertyDescriptor = Object.getOwnPropertyDescriptor(target, key);
    let original: any = propertyDescriptor.value;

    propertyDescriptor.value = async function(
      this: Command<any>,
      message: Message,
      args: any[]
    ): Promise<any> {
      let middlewarePassed: boolean = true;
      try {
        let result: Promise<[Message, any[]]> | [Message, any[]] = func.call(this, message, args);
        if (result instanceof Promise) result = await result;

        if (!(result instanceof Array)) {
          middlewarePassed = false;
        }
        [message, args] = result;
      } catch (ex) {
        middlewarePassed = false;
      }
      if (middlewarePassed) return await original.apply(this, [message, args]);
    };
    return propertyDescriptor;
  };
}

function _setMetaData(key: string, value: any): ClassDecorator {
  return function<T extends Function>(target: T): T {
    Object.defineProperty(target.prototype, key, {
      configurable: true,
      enumerable: true,
      writable: true
    });
    return target;
  };
}
