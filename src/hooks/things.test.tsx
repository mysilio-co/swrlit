import React from 'react'
import { useThing } from './things'
import { AuthenticationProvider } from '../contexts/authentication'
import { renderHook } from '@testing-library/react-hooks'
import { mockSolidDatasetFrom } from '@inrupt/solid-client'


describe("someFunction()", () => {
  test("return value", async () => {
    const { result, waitForValueToChange } = renderHook(() => useThing("https://tvachon.inrupt.net/profile/card#me", {
      fetch: (url) => {
        console.log("FETCHING", url)
        return mockSolidDatasetFrom

        { }
      }
    }))
    console.log("jams")
    expect(result.current.thing).toBe(undefined);
    await waitForValueToChange(() => result.current.thing)
    console.log("HAMS")
    expect(result.current.thing).toBe(undefined);
  });
});
