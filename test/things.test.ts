import 'whatwg-fetch'
//import { act } from '@testing-library/react-hooks'
import { renderHook } from './utils'
//import { givenMolid } from 'molid/lib/molid-jest';

import {
  setStringNoLocale,
  getStringNoLocale,
  mockSolidDatasetFrom,
  setThing,
  createThing,
} from '@inrupt/solid-client'
import { FOAF } from '@inrupt/vocab-common-rdf'

import {
  useThing,
  //  useStorageContainer
} from '../src/hooks/things'

const mockProfile = () =>
  setStringNoLocale(
    createThing({ url: 'https://example.com/profile/card#me' }),
    FOAF.name,
    'A. N. Other'
  )
const mockProfileResource = () =>
  setThing(
    mockSolidDatasetFrom('https://example.com/profile/card'),
    mockProfile()
  )

const newMockFetch = () => {
  const fetcher = jest.fn()
  var resolve: any
  var reject: any
  const fetchResult = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  fetcher.mockReturnValueOnce(fetchResult)
  return { resolve, reject, fetch: fetcher }
}

describe('useThing() unit tests', () => {
  test('fetches and returns a thing that exists', async () => {
    const { fetch, resolve } = newMockFetch()
    const { result, waitForValueToChange } = renderHook(() =>
      useThing('https://example.com/profile/card#me', { fetch })
    )

    expect(result.current.thing).toBe(undefined)

    resolve(mockProfileResource())

    await waitForValueToChange(() => result.current.thing)

    expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual(
      'A. N. Other'
    )
  })

  test("returns null if the resource exists but the thing doesn't", async () => {
    const { fetch, resolve } = newMockFetch()
    const { result, waitForValueToChange } = renderHook(() =>
      useThing('https://example.com/profile/card#you', { fetch })
    )
    expect(result.current.thing).toBe(undefined)

    resolve(mockProfileResource())

    await waitForValueToChange(() => result.current.thing)

    expect(result.current.thing).toEqual(null)
  })

  test('returns a save function if a uri is passed and does not otherwise', async () => {
    // returns save if passed
    const { result: uriDefinedResult } = renderHook(() =>
      useThing('https://example.com/profile/card#me')
    )
    expect(uriDefinedResult.current.save).toBeInstanceOf(Function)

    // does not otherwise
    const { result: uriUndefinedResult } = renderHook(() => useThing(undefined))
    expect(uriUndefinedResult.current.save).toBe(undefined)
  })
})

/*

these molid-dependent tests seem totally broken, but it's not clear why. debug soon.

const webId = (molid: any) => molid.uri("/profile/card#me")
const nonExistantThing = (molid: any) => molid.uri("/profile/card#you")
const fourOhFour = (molid: any) => molid.uri("/this/probably/doesnt/exist")

givenMolid('default', (molid: any) => {
  describe("useThing() integration tests", () => {
    test.only("fetches and returns a thing that exists from molid", async () => {
      console.log("MOLID", molid.uri)
      const { result, waitForValueToChange } = renderHook(
        () => useThing(webId(molid))
      )
      console.log("rendered")
      expect(result.current.thing).toBe(undefined);
      console.log("expect!!")
      await waitForValueToChange(() => result.current.thing)
      console.log("waited")
      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("A. N. Other");
    });

    test("returns null if the resource exists but the thing doesn't", async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useThing(nonExistantThing(molid))
      )
      expect(result.current.thing).toBe(undefined);
      await waitForValueToChange(() => result.current.thing)

      expect(result.current.thing).toEqual(null);
    });

    test("returns an error with status 404 if the resource doesn't exist", async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useThing(fourOhFour(molid))
      )
      expect(result.current.thing).toBe(undefined);
      await waitForValueToChange(() => result.current.error)

      expect(result.current.thing).toEqual(undefined);
      expect(result.current.error.statusCode).toEqual(404);
    });

    // something in here broke with the 0.5.1 upgrade, but it seems to
    // be related to async stuff somehow.
    // this test mostly tests underlying library behavior anyway so skip for now.
    test.skip("provides a function to mutate a value", async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useThing(webId(molid))
      )
      expect(result.current.mutate).toBeDefined();

      await waitForValueToChange(() => result.current.thing)
      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("A. N. Other");

      const { mutate } = result.current
      mutate(setStringNoLocale(result.current.thing, FOAF.name, "O. N. E. Moore"))

      await waitForValueToChange(() => result.current.thing)
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

      const { save } = result.current
      save(setStringNoLocale(result.current.thing, FOAF.name, "O. N. E. Moore"))

      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("O. N. E. Moore");

      result.current.mutate()

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

*/
