import React from 'react'
import { useThing } from './things'
import { mockSolidDatasetFrom, mockThingFrom, setThing, setStringNoLocale } from '@inrupt/solid-client'
import { FOAF } from "@inrupt/vocab-common-rdf"

import { AuthenticationProvider } from '../contexts/authentication'
import { renderHook } from '@testing-library/react-hooks'

const profileUrl = "https://tvachon.inrupt.net/profile/card"

const meUrl = `${profileUrl}#me`
const me = setStringNoLocale(mockThingFrom(meUrl), FOAF.name, "Travis")

const vaconUrl = `${profileUrl}#vacon`
const altnernatePersonality = setStringNoLocale(mockThingFrom(vaconUrl), FOAF.name, "Lord Vacon")

let profile = mockSolidDatasetFrom(profileUrl)
profile = setThing(profile, me)
profile = setThing(profile, altnernatePersonality)

describe("useThing()", () => {
  test("includes a thing from the underlying resource", async () => {

    const { result, waitForValueToChange } = renderHook(() => useThing(meUrl, {
      fetch: (url) => {
        return profile
      }
    }))
    expect(result.current.thing).toBe(undefined);
    await waitForValueToChange(() => result.current.thing)
    expect(result.current.thing).toEqual(me);
    expect(result.current.thing).not.toEqual(profile);
  });
});
