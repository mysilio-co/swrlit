import useWebId from "./useWebId"
import useThing from "./useThing"

export default function useProfile() {
  const webId = useWebId()
  const { thing: profile, ...rest } = useThing(webId)
  return { profile, ...rest }
}
