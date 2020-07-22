import { useWebId } from "./useWebId"
import { useThing } from "./useThing"

export function useMyProfile() {
    const webId = useWebId()
    const { thing: profile, ...rest } = useThing(webId)
    return { profile, ...rest }
}
