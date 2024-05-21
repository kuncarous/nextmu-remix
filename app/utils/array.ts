import { ReactElement } from 'react';
import { z } from 'zod';

function join(
    separator: ReactElement | ((index: number) => ReactElement),
    ...arrays: any[]
) {
    const output = [];
    for (let n = 0; n < arrays.length; ++n) {
        if (arrays.length === 0) continue;
        if (output.length > 0)
            output.push(
                typeof separator === 'function' ? separator(n) : separator,
            );
        output.push(...arrays[n]);
    }
    return output;
}

export function isValidZodLiteralUnion<T extends z.ZodLiteral<unknown>>(
    literals: T[],
): literals is [T, T, ...T[]] {
    return literals.length >= 2;
}

export function constructZodLiteralUnionType<T extends z.Primitive>(
    constArray: readonly T[],
) {
    const literalsArray = constArray.map((literal) => z.literal(literal));
    if (!isValidZodLiteralUnion(literalsArray)) {
        throw new Error(
            'Literals passed do not meet the criteria for constructing a union schema, the minimum length is 2',
        );
    }
    return z.union(literalsArray);
}

export default { join };
