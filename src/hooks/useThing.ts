import useSWR, { ConfigInterface } from 'swr'
import {
    Thing, SolidDataset,
    getSolidDataset, getThing, saveSolidDatasetAt, setThing, getUrlAll,
    getSolidDatasetWithAcl,
    getFile, overwriteFile, getFileWithAcl, asUrl
} from '@itme/solid-client'
import { ldp } from "rdf-namespaces"

import equal from 'fast-deep-equal/es6'

type fetcherFn<Data> = (...args: any) => Data | Promise<Data>

type SwrlitConfigInterface = ConfigInterface & {
    acl?: boolean,
    fetch?: fetcherFn<any>
}

type SwrlitKey = string | null | undefined

function useSwrld(uri: SwrlitKey, options: SwrlitConfigInterface = {}) {
    const { compare, fetch, acl } = options
    options.compare = compare || equal
    const documentURL = uri && new URL(uri)
    if (documentURL) {
        documentURL.hash = ""
    }
    const documentUri = documentURL && documentURL.toString()
    return useSWR(
        documentUri || null,
        fetch || (acl ? getSolidDatasetWithAcl : getSolidDataset),
        options)
}

export function useFile(uri: SwrlitKey, options: SwrlitConfigInterface = {}) {
    const { compare, acl, fetch } = options
    options.fetch = fetch || (acl ? getFileWithAcl : getFile)
    options.compare = compare || equal

    const { data: file, mutate, ...rest } = useSwrld(uri, options)
    const save = async (blob: Blob) => {
        if (uri) {
            mutate(blob, false)
            const savedDataset = await overwriteFile(uri, blob)
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

export function useMeta(uri: SwrlitKey, options = {}) {
    const { resource: meta, ...rest } = useResource(uri && `${uri}.meta`, options)
    return ({
        meta, ...rest
    })
}

export function useResource(uri: SwrlitKey, options: SwrlitConfigInterface = {}) {
    const { data: resource, mutate, ...rest } = useSwrld(uri, options)
    const save = async (newDataset: SolidDataset) => {
        mutate(newDataset, false)
        const savedDataset = await saveSolidDatasetAt(asUrl(resource), newDataset)
        mutate(savedDataset)
        return savedDataset
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

export function useThing(uri: SwrlitKey, options = {}) {
    const { resource, mutate, save: saveResource, ...rest } = useResource(uri, options)
    const thing = resource && uri && getThing(resource, uri)
    const save = async (newThing: Thing) => {
        const newDataset = setThing(resource, newThing)
        return saveResource(newDataset)
    }
    return (
        {
            thing,
            mutate,
            save,
            ...rest
        }
    )
}

export function useContainer(uri: SwrlitKey, options: SwrlitConfigInterface = {}) {
    const { data, ...rest } = useSwrld(uri, options)
    const resourceUrls = data && getUrlAll(data, ldp.contains)
    const resources = resourceUrls && resourceUrls.map(url => {
        return getThing(data, url)
    })
    return { resources, ...rest }
}