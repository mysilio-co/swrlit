import { useState, useEffect } from "react"

import { resourceExists, createDocument, deleteFile } from '../lib/http'

export function useEnsured(url: string | undefined | null) {
  const [ensuredUrl, setEnsuredUrl] = useState<string | undefined | null>()
  useEffect(() => {
    async function ensureUrl(u: string) {
      if (await resourceExists(u)) {
        setEnsuredUrl(u)
      } else {
        await createDocument(`${u}.dummy`)
        await deleteFile(`${u}.dummy`)
        setEnsuredUrl(u)
      }

    }
    if (url) {
      ensureUrl(url)
    }
  }, [url])
  return ensuredUrl
}
