import { ASYNC_FUNCTION } from 'renit/define';
import { isEqual } from './isEqual';
import { isFunction } from './isFunction';

export function isAsync<R>(value: R): value is Include<R, AsyncArrow> {
  return isFunction(value) && isEqual(value.constructor.name, ASYNC_FUNCTION);
}
