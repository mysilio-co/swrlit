import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import {
  Session, getDefaultSession,
  login, logout as solidLogout,
  fetch,
  handleIncomingRedirect,
  //  onSessionRestore,
  ISessionInfo
} from "@inrupt/solid-client-authn-browser";

type Authentication = {
  info: ISessionInfo,
  fetch: Session['fetch'],
  login: Session['login'],
  logout: Session['logout']
}

const defaultContext = {
  info: getDefaultSession().info,
  login,
  fetch,
  logout: solidLogout
}

export const AuthenticationContext = createContext<Authentication>(defaultContext);

export function AuthenticationProvider(props: any) {
  const [info, setInfo] = useState<ISessionInfo>()
  useEffect(function () {
    handleIncomingRedirect({
      restorePreviousSession: true
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

  const value = useMemo(() => ({ info, fetch, login, logout: swrlitLogout }), [info])
  return <AuthenticationContext.Provider value={value} {...props} />
}

export const useAuthentication = () => useContext(AuthenticationContext)

export const useLoggedIn = () => {
  const { info } = useAuthentication()
  return info && info.isLoggedIn
}

export function useWebId() {
  const { info } = useAuthentication()
  return info && info.webId
}
