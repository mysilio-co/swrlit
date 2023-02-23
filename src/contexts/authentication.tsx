import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react'
import {
  Session,
  getDefaultSession,
  login,
  logout as solidLogout,
  fetch,
  handleIncomingRedirect,
  //  onSessionRestore,
  ISessionInfo,
} from '@inrupt/solid-client-authn-browser'
import { onSessionRestore } from '@inrupt/solid-client-authn-browser'

type Authentication = {
  info: ISessionInfo | undefined
  fetch: Session['fetch']
  login: Session['login']
  logout: Session['logout']
}

const defaultContext = {
  info: getDefaultSession().info,
  login,
  fetch,
  logout: solidLogout,
}
/**
 * A React context for authentication state.
 */
export const AuthenticationContext =
  createContext<Authentication>(defaultContext)
interface AuthenticationContextProps {
  onSessionRestore: (url: string) => any
}

/**
 * A React component that makes the authentication context available
 * to downstream components.
 *
 * You should wrap any parts of your React app that need to use
 * authentication state in this provider.
 *
 * @returns a React Context provider
 */
export const AuthenticationProvider: React.FC<AuthenticationContextProps> = ({
  onSessionRestore: sessionRestoreCallback,
  ...props
}) => {
  const [info, setInfo] = useState<ISessionInfo>()

  useEffect(function () {
    sessionRestoreCallback && onSessionRestore(sessionRestoreCallback)

    handleIncomingRedirect({
      restorePreviousSession: true,
    }).then((newInfo) => {
      // don't set this to undefined values - TODO: is this the right thing to do?
      if (newInfo) {
        setInfo(newInfo)
      }
    })
  }, [])

  const swrlitLogout = useCallback(async function swrlitLogout() {
    await solidLogout()
    setInfo(getDefaultSession().info)
  }, [])

  const value = useMemo(
    () => ({ info, fetch, login, logout: swrlitLogout }),
    [info]
  )
  return <AuthenticationContext.Provider value={value} {...props} />
}

/**
 * A React hook that returns the current authentication context.
 *
 * @returns a React Context containing authentication information
 */
export const useAuthentication = () => useContext(AuthenticationContext)

/**
 * A React hook for login state
 *
 * @returns true if the user is logged in, false otherwise
 */
export function useLoggedIn(): boolean {
  const { info } = useAuthentication()
  return !!info && info.isLoggedIn
}

/**
 * A React hook for the current user's webId
 *
 * @returns the user's webId if known, undefined otherwise
 */
export function useWebId(): string | undefined {
  const { info } = useAuthentication()
  return info && info.webId
}
