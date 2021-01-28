import React from 'react'
import { renderHook as upstreamRenderHook, RenderHookOptions, RenderHookResult } from '@testing-library/react-hooks'
import { SWRConfig } from "swr";


const Wrapper = ({ children }: {children?: React.ReactNode}) => {
  return <SWRConfig value={{ dedupingInterval: 0 }}>{children}</SWRConfig>;
};

export function renderHook(callback: (props?: any) => any, options?: RenderHookOptions<any>): RenderHookResult<any, any> {
  return upstreamRenderHook(callback, {wrapper: Wrapper, ...options})
}
