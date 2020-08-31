import { useThing } from './things'

function f() {

}

describe("someFunction()", () => {
    test("return value", () => {
        expect(f()).toBe("test");
    });
});
