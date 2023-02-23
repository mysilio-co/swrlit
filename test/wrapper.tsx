import React from 'react'
import { SWRConfig } from 'swr'

export default function wrapper({ children }: { children?: React.ReactNode }) {
  return (
    <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
      {children}
    </SWRConfig>
  )
}
