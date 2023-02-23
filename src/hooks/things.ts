import { useEffect, useCallback, useMemo } from 'react'
import useSWRHook, { SWRConfiguration, SWRHook } from 'swr'
import type { Fetcher, SWRResponse } from 'swr'
import { Thing, SolidDataset, UrlString } from '@inrupt/solid-client/interfaces'
import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
} from '@inrupt/solid-client/resource/solidDataset'
import { getThing, setThing } from '@inrupt/solid-client/thing/thing'
import { getUrl, getUrlAll } from '@inrupt/solid-client/thing/get'
import { getFile, overwriteFile } from '@inrupt/solid-client/resource/file'

import { LDP } from '@inrupt/vocab-common-rdf'
import { WS } from '@inrupt/vocab-solid-common'

import { dequal } from 'dequal'
import { useAuthentication, useWebId } from '../contexts/authentication'
import { useMemoCompare } from './react'

const useSWR: SWRHook = useSWRHook as any as SWRHook

export type SwrlitConfigInterface = SWRConfiguration & {
  fetch?: Fetcher<any>
}

export type SwrlitKey = UrlString | null | undefined

export type SwrldResult = SWRResponse<any, any>
export type ResourceResult = SwrldResult & {
  resource: SolidDataset
  save: any
}
export type ThingResult = ResourceResult & { thing: Thing; saveResource: any }
export type MetaResult = ResourceResult & { meta: SolidDataset }
export type ContainerResult = SwrldResult & { resources: any }
export type FileResult = SwrldResult & { file: any; save: any }
export type ProfileResult = ThingResult & { profile: Thing }

// Returns an SWR "fetcher" that uses a Solid-enabled fetch
// function. If given a fetcher, wrap it in a function that
// passes the Solid-enabled fetch in its "options" argument,
// if not, just return the fetch itself.
function useFetcher(fetcher?: Fetcher<any>): Fetcher<any> {
  const { fetch } = useAuthentication()
  const result = useMemo(
    () =>
      fetcher
        ? function thingFetcher(url: string, options: any) {
            return fetcher(url, { fetch, ...options })
          }
        : fetch,
    [fetch, fetcher]
  )
  return result
}

/**
 * Retrieve and manage the entity identified by `url`
 *
 * This function wraps `useSWR` and return its result. It will automatically
 * use authentication from a swrlit AuthenticationContext and strips
 * hash fragments from the URL to avoid duplicative caching of Resources.
 *
 * @param url the URL of a file
 * @param options Optional parameter `options.fetch`: An alternative `fetch` function to make the HTTP request, compatible with the browser-native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).
 * @returns a useSWR style response map
 */
export function useSwrld(
  url: SwrlitKey,
  options: SwrlitConfigInterface = {}
): SwrldResult {
  const { fetch } = options
  const fetcher = useFetcher(fetch || getSolidDataset)
  const documentURL = url && new URL(url)
  if (documentURL) {
    documentURL.hash = ''
  }
  const documentUrl = documentURL && documentURL.toString()
  return useSWR(documentUrl || null, fetcher, options)
}

/**
 * Retrieve and manage the file identified by `url`
 *
 * @param uri the URL of a file
 * @param options Optional parameter `options.fetch`: An alternative `fetch` function to make the HTTP request, compatible with the browser-native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).
 * @returns a useSWR style response map
 */
export function useFile(
  uri: SwrlitKey,
  options: SwrlitConfigInterface = {}
): FileResult {
  const { fetch } = options
  options.fetch = fetch || getFile

  const swrldResult = useSwrld(uri, options) as FileResult
  const mutate = swrldResult.mutate
  const authFetch = useFetcher(options && options.fetch)
  const save = async (blob: Blob) => {
    if (uri) {
      mutate(blob, false)
      const savedDataset = await overwriteFile(uri, blob, {
        fetch: authFetch as typeof window.fetch,
      })
      mutate(blob)
      return savedDataset
    } else {
      throw Error(`can't overwrite null or undefined uri: ${uri}`)
    }
  }
  swrldResult.file = swrldResult.data
  swrldResult.save = save
  return swrldResult
}

/**
 * Retrieve and manage the metadata SolidDataset of the Resource identified by `url`
 *
 * @param uri the URL of a Solid Resource
 * @param options Optional parameter `options.fetch`: An alternative `fetch` function to make the HTTP request, compatible with the browser-native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).
 * @returns a useSWR style response map
 */
export function useMeta(
  uri: SwrlitKey,
  options: SwrlitConfigInterface = {}
): MetaResult {
  const result = useResource(uri && `${uri}.meta`, options) as MetaResult
  result.meta = result.resource
  return result
}

/**
 * Retrieve and manage the SolidDataset identified by `url`
 *
 * @param uri the URL of a Solid Resource
 * @param options Optional parameter `options.fetch`: An alternative `fetch` function to make the HTTP request, compatible with the browser-native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).
 * @returns a useSWR style response map
 */
export function useResource(
  url: SwrlitKey,
  options: SwrlitConfigInterface = {}
): ResourceResult {
  const swrldResult = useSwrld(url, options) as ResourceResult
  const mutate = swrldResult.mutate
  const fetch = useFetcher(options.fetch)
  const saveResource = useCallback(
    async function (newDataset: SolidDataset) {
      if (url) {
        mutate(newDataset, false)
        const savedDataset = await saveSolidDatasetAt(url, newDataset, {
          fetch: fetch as typeof window.fetch,
        })
        mutate(savedDataset)
        return savedDataset
      } else {
        throw new Error(`could not save dataset with uri of ${url}`)
      }
    },
    [url, fetch]
  )
  swrldResult.save = url && saveResource
  swrldResult.resource = swrldResult.data
  return swrldResult
}

/**
 * Retrieve and manage the Thing identified by `url`
 *
 * @param uri the URL of a Thing in a Solid Resource
 * @param options Optional parameter `options.fetch`: An alternative `fetch` function to make the HTTP request, compatible with the browser-native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).
 * @returns a useSWR style response map
 */
export function useThing(
  url: SwrlitKey,
  options: SwrlitConfigInterface = {}
): ThingResult {
  return useThingInResource(url, url, options)
}

/**
 * Retrieve the and manage the Thing identified by `thingUri` stored in resource identified by `resourceUri`
 *
 * @param thingUri the URL of a Thing in a Solid Resource
 * @param resourceUri the URL of a Solid Resource
 * @param options Optional parameter `options.fetch`: An alternative `fetch` function to make the HTTP request, compatible with the browser-native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).
 * @returns a useSWR style response map
 */
export function useThingInResource(
  thingUri: SwrlitKey,
  resourceUri: SwrlitKey,
  options: SwrlitConfigInterface = {}
): ThingResult {
  const resourceResult = useResource(resourceUri, options) as ThingResult
  resourceResult.saveResource = resourceResult.save
  const resource = resourceResult.resource
  const thisThing = resource && thingUri && getThing(resource, thingUri)
  resourceResult.thing = useMemoCompare(thisThing, dequal)
  resourceResult.save = useCallback(
    async (newThing: Thing) => {
      let maybeNewResource = resourceResult.resource
      if (
        resourceResult &&
        resourceResult.error &&
        resourceResult.error === 404
      ) {
        maybeNewResource = createSolidDataset()
      }
      const newDataset = setThing(maybeNewResource, newThing)
      return resourceResult.saveResource(newDataset)
    },
    [resourceResult]
  )

  return resourceResult
}

/**
 * Retrieve and manage the Container identified by `url`
 *
 * @param uri the URL of a Solid Container
 * @param options Optional parameter `options.fetch`: An alternative `fetch` function to make the HTTP request, compatible with the browser-native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).
 * @returns a useSWR style response map
 */
export function useContainer(
  uri: SwrlitKey,
  options: SwrlitConfigInterface = {}
): ContainerResult {
  const swrldResult = useSwrld(uri, options) as ContainerResult
  const data = swrldResult.data
  const container = data && uri && getThing(data, uri)
  const resourceUrls = container && getUrlAll(container, LDP.contains)
  const resources =
    resourceUrls &&
    resourceUrls.map((url: string) => {
      return getThing(data, url)
    })
  swrldResult.resources = resources
  return swrldResult
}

/**
 * Retrieve and manage the profile document identified by `webId`
 *
 * @param webId the URL of a Solid profile document
 * @param options Optional parameter `options.fetch`: An alternative `fetch` function to make the HTTP request, compatible with the browser-native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).
 * @returns a useSWR style response map
 */
export function useProfile(
  webId: SwrlitKey,
  options: SwrlitConfigInterface = {}
) {
  const thingResult = useThing(webId, options) as ProfileResult
  thingResult.profile = thingResult.thing
  return thingResult
}

/**
 * Retrieve and manage the storage container from the profile document identified by `webId`
 *
 * @param webId the URL of a Solid profile document
 * @param options Optional parameter `options.fetch`: An alternative `fetch` function to make the HTTP request, compatible with the browser-native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).
 * @returns a useSWR style response map
 */
export function useStorageContainer(
  webId: SwrlitKey,
  options: SwrlitConfigInterface = {}
) {
  const { profile } = useProfile(webId, options)
  return profile && getUrl(profile, WS.storage)
}

/**
 * Retrieve and manage the profile document of the currently authenticated user.
 *
 * @param options Optional parameter `options.fetch`: An alternative `fetch` function to make the HTTP request, compatible with the browser-native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters).
 * @returns a useSWR style response map
 */
export function useMyProfile(options: SwrlitConfigInterface = {}) {
  const webId = useWebId()
  return useProfile(webId, options)
}
