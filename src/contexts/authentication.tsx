import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  getSession,
  login,
  fetch,
  logout
} from 'solid-auth-fetcher'

// THESE TYPES ARE FROM solid-auth-fetcher
// TODO: patch solid-auth-fetcher to export these types so we can use them here

const fetcher = async (url: any, options: any) => {
  const res = await fetch(url, options)
  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.')
    error.info = await res.text(),
    error.status = res.status
    throw error
  }
  return res
}


type ILoginInputOptions =
  | (IIssuerLoginInputOptions & IRedirectLoginInputOptions)
  | (IIssuerLoginInputOptions & IPopupLoginInputOptions)
  | (IWebIdLoginInputOptions & IRedirectLoginInputOptions)
  | (IWebIdLoginInputOptions & IPopupLoginInputOptions);

interface ICoreLoginInuptOptions {
  state?: string;
  clientId?: string;
  doNotAutoRedirect?: boolean;
  clientName?: string;
}

interface IIssuerLoginInputOptions extends ICoreLoginInuptOptions {
  webId: string;
}

interface IWebIdLoginInputOptions extends ICoreLoginInuptOptions {
  oidcIssuer: string;
}

interface IRedirectLoginInputOptions extends ICoreLoginInuptOptions {
  redirect: string;
}

interface IPopupLoginInputOptions extends ICoreLoginInuptOptions {
  popUp: boolean;
  popUpRedirectPath: string;
}

type ISolidSession = ILoggedInSolidSession | ILoggedOutSolidSession;

interface INeededAction {
  actionType: string;
}
interface ICoreSolidSession {
  localUserId: string;
  neededAction: INeededAction;
}

export interface ILoggedInSolidSession extends ICoreSolidSession {
  loggedIn: true;
  webId: string;
  state?: string;
  logout: () => Promise<void>;
  fetch: (url: RequestInfo, init?: RequestInit) => Promise<Response>;
}

interface ILoggedOutSolidSession extends ICoreSolidSession {
  loggedIn: false;
}
import type ILoginInputOptions from 'solid-auth-fetcher'

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

export function AuthenticationProvider(props: any) {
  const [session, setSession] = useState<ISolidSession | null>()
  useEffect(() => {
    async function fetchSession() {
      setSession(await getSession() || {
        loggedIn: false,
        localUserId: Math.random().toString(),
        neededAction: {actionType: ""}
      })
    }
    fetchSession()
  }, [])

  const value = ({
    session,
    fetch: fetcher,

    login: async (options: ILoginInputOptions = {oidcIssuer: "", popUp: false, popUpRedirectPath: window.location.href, redirect: window.location.href}) => {
      await login(options)
      setSession(await getSession())
    },
    loginHandle: async (handle: string, options: ILoginInputOptions = {oidcIssuer: "", popUp: false, popUpRedirectPath: window.location.href, redirect: window.location.href}) => {
      await login({
        ...options,
        oidcIssuer: handleToIdp(handle).toString()
      })
      setSession(await getSession())
    },
    popupLogin: async (args: any) => {
      await login({ popUp: true, ...args })
      setSession(await getSession())
    },
    logout: async () => {
      await logout()
      setSession(await getSession())
    }
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
  return session && session.loggedIn
}

export function useWebId() {
  const { session } = useAuthentication()
  return session && session.webId
}
