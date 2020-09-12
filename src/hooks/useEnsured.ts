import { useState, useEffect } from "react"

import { resourceExists, createDocument, deleteFile } from '../lib/http'
import { useAuthentication } from '../contexts/authentication'

export function useEnsured(url: string | undefined | null) {
  const [ensuredUrl, setEnsuredUrl] = useState<string | undefined | null>()
  const { session } = useAuthentication()
  useEffect(() => {
    async function ensureUrl(u: string) {
      if (await resourceExists(session, u)) {
        setEnsuredUrl(u)
      } else {
        await createDocument(session, `${u}.dummy`)
        await deleteFile(session, `${u}.dummy`)
        setEnsuredUrl(u)
      }

    }
    if (url && session) {
      ensureUrl(url)
    }
  }, [url, session])
  return ensuredUrl
}
