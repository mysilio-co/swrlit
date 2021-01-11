import { useState, useEffect } from "react"

import { resourceExists, createDocument, deleteFile } from '../lib/http'
import { useAuthentication } from '../contexts/authentication'

export function useEnsured(url: string | undefined | null) {
  const [ensuredUrl, setEnsuredUrl] = useState<string | undefined | null>()
  const { fetch } = useAuthentication()
  useEffect(() => {
    async function ensureUrl(u: string) {
      if (await resourceExists(fetch, u)) {
        setEnsuredUrl(u)
      } else {
        await createDocument(fetch, `${u}.dummy`)
        await deleteFile(fetch, `${u}.dummy`)
        setEnsuredUrl(u)
      }
    }
    if (url && fetch) {
      ensureUrl(url)
    }
  }, [url, fetch])
  return ensuredUrl
}
