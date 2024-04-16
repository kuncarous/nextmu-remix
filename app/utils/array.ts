import { ReactElement } from 'react';

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

export default { join };
