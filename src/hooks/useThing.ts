import useSWR, { ConfigInterface } from 'swr'
import {
  fetchLitDataset, getThingOne, saveLitDatasetAt, setThing, getUrlAll, Thing
} from '@itme/lit-pod'
import { ldp } from "rdf-namespaces"

import equal from 'fast-deep-equal/es6'

export default function useThing(uri: string | undefined | null, { compare = equal, ...options }: ConfigInterface = {}) {
  const documentURL = uri && new URL(uri)
  if (documentURL) {
    documentURL.hash = ""
  }
  const documentUri = documentURL && documentURL.toString()
  const { data, mutate, ...rest } = useSWR(documentUri || null, fetchLitDataset, { compare, ...options })
  const thing: Thing = data && getThingOne(data, uri)
  const save = async (newThing: Thing) => {
    if (documentUri) {
      const newDataset = setThing(data, newThing)
      mutate(newDataset, false)
      const savedDataset = await saveLitDatasetAt(documentUri, newDataset)
      mutate(savedDataset)
      return savedDataset
    } else {
      throw Error("documentUri not defined")
    }
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
