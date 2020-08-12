import React, { createContext, useContext } from 'react'
import auth from 'solid-auth-client'
import { getSolidDataset } from "@itme/solid-client"

export type fetcherFn<Data> = (...args: any) => Data | Promise<Data>

type Authentication = {
  session: any,
  fetch: fetcherFn<any>,
  login: (options: any) => Promise<void>,
  popupLogin: () => Promise<void>,
  logout: () => Promise<void>
}

const AuthenticationContext = createContext<Authentication>({
  session: null,
  login: async (options) => {
    console.error("No default login implementation - have you added an AuthenticationProvider at the top level of your app?")
  },
  popupLogin: async () => {
    console.error("No default popupLogin implementation - have you added an AuthenticationProvider at the top level of your app?")
  },
  fetch: async (url, options) => {
    console.error("No default fetch implementation - have you added an AuthenticationProvider at the top level of your app?")
  },
  logout: async () => {
    console.error("No default logout implementation - have you added an AuthenticationProvider at the top level of your app?")
  }
});

const { Provider, Consumer } = AuthenticationContext

export const AuthenticationProvider = (props: any) => {
  const value = ({
    session: auth,
    fetch: auth.fetch,
    login: auth.login,
    logout: auth.logout,
    popupLogin: auth.popupLogin
  })
  return (
    <Provider value={value}  {...props} />
  )
}

export const useAuthentication = () => useContext(AuthenticationContext)
