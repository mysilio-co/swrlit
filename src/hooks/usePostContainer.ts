import { space } from "rdf-namespaces"
import { getUrlOne } from "@itme/lit-pod";

import useProfile from "./useProfile"
import useEnsured from "./useEnsured"

export default function usePostContainer() {
  const { profile } = useProfile()
  const storageContainer = profile && getUrlOne(profile, space.storage)
  const postContainer = useEnsured(storageContainer && `${storageContainer}public/posts/`)
  return postContainer
}
