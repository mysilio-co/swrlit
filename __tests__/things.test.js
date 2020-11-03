import { renderHook } from '@testing-library/react-hooks'
import { givenMolid } from 'molid/lib/molid-jest';

import {
    mockSolidDatasetFrom, mockThingFrom, setThing, setStringNoLocale,
    getStringNoLocale
} from '@inrupt/solid-client'
import { FOAF } from "@inrupt/vocab-common-rdf"

import { AuthenticationProvider } from '../src/contexts/authentication'
import { useThing, useStorageContainer } from '../src/hooks/things'

const webId = molid => molid.uri("/profile/card#me")

givenMolid('default', molid => {
  describe("useThing()", () => {
    test("includes a thing from the underlying resource", async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useThing(webId(molid))
      )
      expect(result.current.thing).toBe(undefined);
      await waitForValueToChange(() => result.current.thing)
      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("A. N. Other");
    });
  });

  describe("useStorageContainer", () => {
    test("returns the url of the storage container", async () => {
      const { result, waitForNextUpdate } = renderHook(() => useStorageContainer(webId(molid)))
      await waitForNextUpdate()
      expect(result.current).toBe(molid.uri("/"));
    })
  })
});
