import { useEffect } from 'react'
import useSWR, { ConfigInterface } from 'swr'
import {
  Thing, SolidDataset,
  getSolidDataset, getThing, saveSolidDatasetAt, setThing, getUrlAll,
  getSolidDatasetWithAcl,
  getFile, overwriteFile, getFileWithAcl,
  createSolidDataset
} from '@itme/solid-client'
import { LDP } from "@inrupt/vocab-common-rdf"

import equal from 'fast-deep-equal/es6'
import { useAuthentication, fetcherFn } from '../contexts/authentication'
import { usePubSub } from '../contexts/pubsub'

export function useWebId() {
  const { session } = useAuthentication()
  return session && session.info && session.info.webId
}

type SwrlitConfigInterface = ConfigInterface & {
  acl?: boolean,
  fetch?: fetcherFn<any>,
  subscribe?: boolean
}

type SwrlitKey = string | null | undefined

function useFetch(fetcher?: fetcherFn<any>) {
  const { fetch } = useAuthentication()
  return fetcher ? (
    function thingFetcher(url: string, options: any) {
      return fetcher(url, { fetch, ...options })
    }
  ) : fetch
}

export function useSwrld(uri: SwrlitKey, options: SwrlitConfigInterface = {}) {
  const { compare, fetch, acl, subscribe = false } = options
  const fetcher = useFetch(fetch || (acl ? getSolidDatasetWithAcl : getSolidDataset))
  options.compare = compare || equal
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
  const { compare, acl, fetch } = options
  options.fetch = fetch || (acl ? getFileWithAcl : getFile)
  options.compare = compare || equal

  const { data: file, mutate, ...rest } = useSwrld(uri, options)
  const authFetch = useFetch()
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

export function useMeta(uri: SwrlitKey, options?: SwrlitConfigInterface) {
  const { resource: meta, ...rest } = useResource(uri && `${uri}.meta`, options)
  return ({
    meta, ...rest
  })
}

export function useResource(uri: SwrlitKey, options?: SwrlitConfigInterface) {
  const { data: resource, mutate, ...rest } = useSwrld(uri, options)
  const fetch = useFetch()
  const save = async (newDataset: SolidDataset) => {
    if (uri) {
      mutate(newDataset, false)
      const savedDataset = await saveSolidDatasetAt(uri, newDataset, { fetch })
      mutate(savedDataset)
      return savedDataset
    } else {
      throw new Error(`could not save dataset with uri of ${uri}`)
    }
  }
  return (
    {
      resource,
      mutate,
      save,
      ...rest
    }
  )
}

export function useThing(uri: SwrlitKey, options?: SwrlitConfigInterface) {
  const { resource, mutate, save: saveResource, ...rest } = useResource(uri, options)
  const thing = resource && uri && getThing(resource, uri)
  const save = async (newThing: Thing) => {
    const newDataset = setThing(resource || createSolidDataset(), newThing)
    return saveResource(newDataset)
  }
  return (
    {
      thing,
      mutate,
      save,
      resource,
      saveResource,
      ...rest
    }
  )
}

export function useContainer(uri: SwrlitKey, options?: SwrlitConfigInterface) {
  const { data, ...rest } = useSwrld(uri, options)
  const resourceUrls = data && getUrlAll(data, LDP.contains)
  const resources = resourceUrls && resourceUrls.map(url => {
    return getThing(data, url)
  })
  return { resources, ...rest }
}

export function useProfile(webId: SwrlitKey, options?: SwrlitConfigInterface) {
  const { thing: profile, ...rest } = useThing(webId, options)
  return { profile, ...rest }
}

export function useMyProfile(options?: SwrlitConfigInterface) {
  const webId = useWebId()
  return useProfile(webId, options)
}
