import { useEffect, useCallback, useMemo } from 'react'
import useSWRHook, { SWRConfiguration, SWRHook } from 'swr'
import type { Fetcher, SWRResponse } from 'swr'
import {
  Thing,
  SolidDataset,
  UrlString
} from '@inrupt/solid-client/interfaces'
import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
} from '@inrupt/solid-client/resource/solidDataset'
import {
  getThing,
  setThing
} from '@inrupt/solid-client/thing/thing'
import {
  getUrl,
  getUrlAll,
} from '@inrupt/solid-client/thing/get'
import {
  getFile,
  overwriteFile,
} from '@inrupt/solid-client/resource/file'

import { LDP } from "@inrupt/vocab-common-rdf"
import { WS } from '@inrupt/vocab-solid-common'

import { dequal } from 'dequal'
import { useAuthentication, useWebId } from '../contexts/authentication'
import { usePubSub } from '../contexts/pubsub'
import { useMemoCompare } from './react'

const useSWR: SWRHook = (useSWRHook as any) as SWRHook

export type SwrlitConfigInterface = SWRConfiguration & {
  fetch?: Fetcher<any>,
  subscribe?: boolean
}

export type SwrlitKey = UrlString | null | undefined


export type SwrldResult = SWRResponse<any, any>
export type ResourceResult = SwrldResult & { resource: SolidDataset, save: any }
export type ThingResult = ResourceResult & { thing: Thing, saveResource: any }
export type MetaResult = ResourceResult & { meta: SolidDataset }
export type ContainerResult = SwrldResult & { resources: any }
export type FileResult = SwrldResult & { file: any, save: any }
export type ProfileResult = ThingResult & { profile: Thing }


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

export function useSwrld(uri: SwrlitKey, options: SwrlitConfigInterface = {}): SwrldResult {
  const { fetch, subscribe = false } = options
  const fetcher = useFetcher(fetch || getSolidDataset);
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

export function useFile(uri: SwrlitKey, options: SwrlitConfigInterface = {}): FileResult {
  const { fetch } = options
  options.fetch = fetch || getFile;

  const swrldResult = useSwrld(uri, options) as FileResult
  const mutate = swrldResult.mutate
  const authFetch = useFetcher(options && options.fetch)
  const save = async (blob: Blob) => {
    if (uri) {
      mutate(blob, false)
      const savedDataset = await overwriteFile(uri, blob, { fetch: authFetch as typeof window.fetch })
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

export function useMeta(uri: SwrlitKey, options: SwrlitConfigInterface = {}): MetaResult {
  const result = useResource(uri && `${uri}.meta`, options) as MetaResult
  result.meta = result.resource
  return result
}

export function useResource(uri: SwrlitKey, options: SwrlitConfigInterface = {}): ResourceResult {
  const swrldResult = useSwrld(uri, options) as ResourceResult
  const mutate = swrldResult.mutate
  const fetch = useFetcher(options.fetch)
  const saveResource = useCallback(
    async function (newDataset: SolidDataset) {
      if (uri) {
        mutate(newDataset, false);
        const savedDataset = await saveSolidDatasetAt(uri, newDataset, {
          fetch: fetch as typeof window.fetch,
        });
        mutate(savedDataset);
        return savedDataset;
      } else {
        throw new Error(`could not save dataset with uri of ${uri}`);
      }
    },
    [uri, fetch]
  );
  swrldResult.save = uri && saveResource
  swrldResult.resource = swrldResult.data
  return (swrldResult)
}

/**
 * Use the thing identified by `uri`
 *
 * @param options - The first input number
 * @returns a useSWR style response map
 */
export function useThing(uri: SwrlitKey, options: SwrlitConfigInterface = {}): ThingResult {
  return useThingInResource(uri, uri, options);
}

/**
 * Use the thing identified by `thingUri` stored in resource identified by `resourceUri`
 *
 * @param options - The first input number
 * @returns a useSWR style response map
 */
export function useThingInResource(
  thingUri: SwrlitKey,
  resourceUri: SwrlitKey,
  options: SwrlitConfigInterface = {}
): ThingResult {
  const resourceResult = useResource(resourceUri, options) as ThingResult;
  const resource = resourceResult.resource;
  const saveResource = resourceResult.save;
  const thisThing = resource && thingUri && getThing(resource, thingUri);
  const thing = useMemoCompare(thisThing, dequal);
  const saveThing = useCallback(
    async (newThing: Thing) => {
      let maybeNewResource = resourceResult.resource;
      if (
        resourceResult &&
        resourceResult.error &&
        resourceResult.error === 404
      ) {
        maybeNewResource = createSolidDataset();
      }
      const newDataset = setThing(maybeNewResource, newThing);
      return resourceResult.save(newDataset);
    },
    [resourceResult]
  );

  resourceResult.thing = thing;
  resourceResult.saveResource = saveResource;
  resourceResult.save = thingUri && saveThing;

  return resourceResult;
};

export function useContainer(uri: SwrlitKey, options: SwrlitConfigInterface = {}): ContainerResult {
  const swrldResult = useSwrld(uri, options) as ContainerResult
  const data = swrldResult.data
  const container = data && uri && getThing(data, uri)
  const resourceUrls = container && getUrlAll(container, LDP.contains)
  const resources = resourceUrls && resourceUrls.map((url: string) => {
    return getThing(data, url)
  })
  swrldResult.resources = resources
  return swrldResult
}

export function useProfile(webId: SwrlitKey, options: SwrlitConfigInterface = {}) {
  const thingResult = useThing(webId, options) as ProfileResult
  thingResult.profile = thingResult.thing
  return thingResult
}

export function useStorageContainer(webId: SwrlitKey) {
  const { profile } = useProfile(webId)
  return profile && getUrl(profile, WS.storage)
}

export function useMyProfile(options: SwrlitConfigInterface = {}) {
  const webId = useWebId()
  return useProfile(webId, options)
}
