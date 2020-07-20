import useSWR, { ConfigInterface } from 'swr'
import {
    fetchLitDataset, getThingOne, getUrlAll
} from '@itme/lit-pod'
import { ldp } from "rdf-namespaces"

import equal from 'fast-deep-equal/es6'

export function useContainer(uri: string, { compare = equal, ...options }: ConfigInterface = {}) {
    const { data, ...rest } = useSWR(uri, fetchLitDataset, { compare, ...options })
    const resourceUrls = data && getUrlAll(data, ldp.contains)
    const resources = resourceUrls && resourceUrls.map(url => {
        return getThingOne(data, url)
    })
    return { resources, ...rest }
}

export default useThing;
