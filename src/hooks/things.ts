import { useEffect, useCallback, useMemo } from 'react'
import useSWR, { SWRConfiguration } from 'swr'
import type { Fetcher } from 'swr'
import {
  Thing, SolidDataset,
  getSolidDataset, getThing, saveSolidDatasetAt, setThing, getUrlAll, getUrl,
  getSolidDatasetWithAcl,
  getFile, overwriteFile, getFileWithAcl,
  createSolidDataset
} from '@inrupt/solid-client'
import { LDP } from "@inrupt/vocab-common-rdf"
import { WS } from '@inrupt/vocab-solid-common'

import { dequal } from 'dequal'
import { useAuthentication, useWebId } from '../contexts/authentication'
import { usePubSub } from '../contexts/pubsub'
import { useMemoCompare } from './react'

type SwrlitConfigInterface = SWRConfiguration & {
  acl?: boolean,
  fetch?: Fetcher<any>,
  subscribe?: boolean
}

type SwrlitKey = string | null | undefined

// Returns an SWR "fetcher" that uses a Solid-enabled fetch
// function. If given a fetcher, wrap it in a function that
// passes the Solid-enabled fetch in its "options" argument,
// if not, just return the fetch itself.
function useFetcher(fetcher?: Fetcher<any>): Fetcher<any> {
  const { fetch } = useAuthentication()
  const result = useMemo(() => (
    fetcher ? (
      function thingFetcher(url: string, options: any) {
        return fetcher(url, { fetch, ...options })
      }
    ) : fetch
  ), [fetch, fetcher])
  return result
}

export function useSwrld(uri: SwrlitKey, options: SwrlitConfigInterface = {}) {
  const { fetch, acl, subscribe = false } = options
  const fetcher = useFetcher(fetch || (acl ? getSolidDatasetWithAcl : getSolidDataset))
  const documentURL = uri && new URL(uri)
  if (documentURL) {
    documentURL.hash = ""
  }
  const documentUri = documentURL && documentURL.toString()
  const { sub } = usePubSub()
  useEffect(function maybeSubscribe() {
    async function subscribeToUri() {
      if (documentUri) {
        sub(documentUri)
      }
    }
    if (subscribe) {
      subscribeToUri()
    }
  }, [documentUri, subscribe])
  return useSWR(
    documentUri || null,
    fetcher,
    options)
}

export function useFile(uri: SwrlitKey, options: SwrlitConfigInterface = {}) {
  const { acl, fetch } = options
  options.fetch = fetch || (acl ? getFileWithAcl : getFile)

  const { data: file, mutate, ...rest } = useSwrld(uri, options)
  const authFetch = useFetcher(options && options.fetch)
  const save = async (blob: Blob) => {
    if (uri) {
      mutate(blob, false)
      const savedDataset = await overwriteFile(uri, blob, { fetch: authFetch })
      mutate(blob)
      return savedDataset
    } else {
      throw Error(`can't overwrite null or undefined uri: ${uri}`)
    }
  }
  return (
    {
      file,
      mutate,
      save,
      ...rest
    }
  )
}

type SwrldResult = any
type ResourceResult = SwrldResult | { save: any }
type MetaResult = ResourceResult | { meta: any }

export function useMeta(uri: SwrlitKey, options: SwrlitConfigInterface = {}): MetaResult {
  const { resource: meta, ...rest } = useResource(uri && `${uri}.meta`, options)
  return ({
    meta, ...rest
  })
}

export function useResource(uri: SwrlitKey, options: SwrlitConfigInterface = {}): ResourceResult {
  const { data: resource, mutate, ...rest } = useSwrld(uri, options)
  const fetch = useFetcher(options.fetch)
  const saveResource = useCallback(async function (newDataset: SolidDataset) {
    if (uri) {
      mutate(newDataset, false)
      const savedDataset = await saveSolidDatasetAt(uri, newDataset, { fetch })
      mutate(savedDataset)
      return savedDataset
    } else {
      throw new Error(`could not save dataset with uri of ${uri}`)
    }
  }, [uri, fetch])
  return (
    {
      resource,
      mutate,
      save: uri && saveResource,
      ...rest
    }
  )
}

/**
 * Use the thing identified by `uri`
 *
 * @param options - The first input number
 * @returns a useSWR style response map
 */
export function useThing(uri: SwrlitKey, options: SwrlitConfigInterface = {}) {
  const { resource, mutate, save: saveResource, ...rest } = useResource(uri, options)
  const thisThing = resource && uri && getThing(resource, uri)
  const thing = useMemoCompare(thisThing, dequal)
  const saveThing = useCallback(async (newThing: Thing) => {
    const newDataset = setThing(resource || createSolidDataset(), newThing)
    return saveResource(newDataset)
  }, [resource, saveResource])
  return (
    {
      thing,
      mutate,
      save: uri && saveThing,
      resource,
      saveResource,
      ...rest
    }
  )
}

export function useContainer(uri: SwrlitKey, options: SwrlitConfigInterface = {}) {
  const { data, ...rest } = useSwrld(uri, options)
  const container = data && uri && getThing(data, uri)
  const resourceUrls = container && getUrlAll(container, LDP.contains)
  const resources = resourceUrls && resourceUrls.map((url: string) => {
    return getThing(data, url)
  })
  return { resources, ...rest }
}

export function useProfile(webId: SwrlitKey, options: SwrlitConfigInterface = {}) {
  const { thing: profile, ...rest } = useThing(webId, options)
  return { profile, ...rest }
}

export function useStorageContainer(webId: SwrlitKey) {
  const { profile } = useProfile(webId)
  return profile && getUrl(profile, WS.storage)
}

export function useMyProfile(options: SwrlitConfigInterface = {}) {
  const webId = useWebId()
  return useProfile(webId, options)
}
