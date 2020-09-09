import { useThing } from './things'
import {
    mockSolidDatasetFrom, mockThingFrom, setThing, setStringNoLocale,
    getStringNoLocale
} from '@inrupt/solid-client'
import { FOAF } from "@inrupt/vocab-common-rdf"

import { AuthenticationProvider } from '../contexts/authentication'
import { renderHook } from '@testing-library/react-hooks'

import { start as startMolid } from 'molid';

let molid;
beforeAll(async () => {
    molid = await startMolid()
});

afterAll(async () => {
    await molid.stop()
});



describe("useThing()", () => {
    test("includes a thing from the underlying resource", async () => {
        const { result, waitForValueToChange } = renderHook(() => useThing(molid.uri("/profile/card#me")))
        expect(result.current.thing).toBe(undefined);
        await waitForValueToChange(() => result.current.thing)
        expect(getStringNoLocale(result.current.thing, FOAF.name)).toEqual("A. N. Other");
    });
});
