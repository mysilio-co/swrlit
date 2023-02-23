import {
  renderHook as upstreamRenderHook,
  RenderHookOptions,
  RenderHookResult,
} from '@testing-library/react-hooks'
import wrapper from './wrapper'

export function renderHook(
  callback: (props?: any) => any,
  options?: RenderHookOptions<any>
): RenderHookResult<any, any> {
  return upstreamRenderHook(callback, { wrapper, ...options })
}
