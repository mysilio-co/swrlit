import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  Session,
  SessionManager,
} from '@inrupt/solid-client-authn-browser'
import {
  ILoginInputOptions
} from '@inrupt/solid-client-authn-core'

export type fetcherFn<Data> = (...args: any) => Data | Promise<Data>

type Authentication = {
  session: any,
  fetch: fetcherFn<any>,
  login: (options?: ILoginInputOptions) => Promise<void>,
  loginHandle: (handle: string, options?: ILoginInputOptions) => Promise<void>,
  popupLogin: () => Promise<void>,
  logout: () => Promise<void>
}

const defaultFetch = async (url: string, options: any) => {
  return window.fetch(url, options)
}

const defaultLogin = async () => {
  console.error("No default login implementation - have you added an AuthenticationProvider at the top level of your app?")
}

const defaultLoginHandle = async () => {
  console.error("No default loginHandle implementation - have you added an AuthenticationProvider at the top level of your app?")
}

const defaultPopupLogin = async () => {
  console.error("No default popupLogin implementation - have you added an AuthenticationProvider at the top level of your app?")
}

const defaultLogout = async () => {
  console.error("No default logout implementation - have you added an AuthenticationProvider at the top level of your app?")
}

const AuthenticationContext = createContext<Authentication>({
  session: null,
  login: defaultLogin,
  loginHandle: defaultLoginHandle,
  popupLogin: defaultPopupLogin,
  fetch: defaultFetch,
  logout: defaultLogout
});

const { Provider } = AuthenticationContext

class BrowserStorage {
  async get(key: string) {
    return window.localStorage.getItem(key) || undefined;
  }
  async set(key: string, value: any) {
    window.localStorage.setItem(key, value);
  }
  async delete(key: string) {
    window.localStorage.removeItem(key);
  }
}

export function AuthenticationProvider(props: any) {
  const [sessionManager] = useState<SessionManager>(new SessionManager({
    // this isn't great, but is noted as a problem in the library here:
    //https://github.com/inrupt/solid-client-authn-js/blob/70cd413405667de4abd0e3fde922e7205a6e5e53/src/login/oidc/ClientRegistrar.ts#L77
    // and in any case is exactly what solid-auth-client was doing
    secureStorage: new BrowserStorage()
  }));
  const [session, setSession] = useState<Session | undefined>()
  useEffect(() => {
    async function fetchSession() {
      setSession(await sessionManager.getSession("default"))
    }
    fetchSession()
  }, [])

  const value = ({
    session,
    fetch: session ? session.fetch : defaultFetch,

    login: session ? async (options: ILoginInputOptions = {}) => {
      const { redirectUrl, ...args } = options
      await session.login({
        redirectUrl: redirectUrl || window.location.href,
        ...args
      })
      setSession(await sessionManager.getSession("default"))
    } : defaultLogin,
    loginHandle: session ? async (handle: string, options: ILoginInputOptions = {}) => {
      const { redirectUrl, ...args } = options
      await session.login({
        oidcIssuer: handleToIdp(handle),
        redirectUrl: redirectUrl || window.location.href,
        ...args
      })
      setSession(await sessionManager.getSession("default"))
    } : defaultLoginHandle,
    popupLogin: session ? async (args: any) => {
      await session.login({ popUp: true, ...args })
      setSession(await sessionManager.getSession("default"))
    } : defaultPopupLogin,
    logout: session ? async () => {
      await session.logout()
      setSession(await sessionManager.getSession("default"))
    } : defaultLogout
  })
  return (
    <Provider value={value}  {...props} />
  )
}

export function handleToIdp(handle: string) {
  try {
    new URL(handle);
    // if this doesn't throw, it's a valid URL
    return handle
  } catch (_) {
    return `https://${handle}`
  }
}

export const useAuthentication = () => useContext(AuthenticationContext)

export const useLoggedIn = () => {
  const { session } = useAuthentication()
  return session && session.info && session.info.isLoggedIn
}
