import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  Session, getDefaultSession,
  login, logout, fetch,
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
  logout
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
  })
  const value = useMemo(() => ({info, fetch, login, logout}), [info])
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
