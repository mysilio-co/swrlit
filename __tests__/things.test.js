import { renderHook } from '@testing-library/react-hooks'
import { givenMolid } from 'molid/lib/molid-jest';

import {
    mockSolidDatasetFrom, mockThingFrom, setThing, setStringNoLocale,
    getStringNoLocale
} from '@inrupt/solid-client'
import { FOAF } from "@inrupt/vocab-common-rdf"

import { AuthenticationProvider } from '../src/contexts/authentication'
import { useThing } from '../src/hooks/things'

givenMolid('default', molid => {
  describe("useThing()", () => {
    test("includes a thing from the underlying resource", async () => {
      const { result, waitForValueToChange } = renderHook(() => useThing(molid.uri("/profile/card#me")))
      expect(result.current.thing).toBe(undefined);
      await waitForValueToChange(() => result.current.thing)
      expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("A. N. Other");
    });
  });
});
