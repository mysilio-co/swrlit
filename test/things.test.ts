import 'whatwg-fetch'
import { renderHook, act } from '@testing-library/react-hooks'
import { givenMolid } from 'molid/lib/molid-jest';

import { setStringNoLocale, getStringNoLocale } from '@inrupt/solid-client'
import { FOAF } from "@inrupt/vocab-common-rdf"

import { useThing, useStorageContainer } from '../src/hooks/things'

const webId = (molid: any) => molid.uri("/profile/card#me")

givenMolid('default', (molid: any) => {
  describe("useThing()", () => {
    test("includes a thing from the underlying resource", async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useThing(webId(molid))
      )
      expect(result.current.thing).toBe(undefined);

      await waitForValueToChange(() => result.current.thing)
      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("A. N. Other");
    });

    test("provides a function to mutate a value", async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useThing(webId(molid))
      )
      expect(result.current.mutate).toBeDefined();

      await waitForValueToChange(() => result.current.thing)
      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("A. N. Other");

      act(() => {
        const { mutate } = result.current
        mutate(setStringNoLocale(result.current.thing, FOAF.name, "O. N. E. Moore"))
      })
      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("O. N. E. Moore");
    });

    // skip until Molid supports mutation
    test.skip("provides a function to save a value", async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useThing(webId(molid))
      )
      expect(result.current.save).toBeDefined();

      await waitForValueToChange(() => result.current.thing)
      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("A. N. Other");

      act(() => {
        const { save } = result.current
        save(setStringNoLocale(result.current.thing, FOAF.name, "O. N. E. Moore"))
      })
      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("O. N. E. Moore");

      act(() => {
        result.current.mutate()
      })
      await waitForValueToChange(() => result.current.thing)
      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("O. N. E. Moore");
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
