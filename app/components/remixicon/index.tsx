import classNames from 'classnames';
import type * as CSS from 'csstype';

interface IRemixIconProps {
    icon: string;
    style?: CSS.Properties;
    size?: CSS.Property.Height<string | number> | undefined;
    color?: CSS.Property.Color;
}
export function RemixIcon({ icon, style, size, color }: IRemixIconProps) {
    return (
        <i
            className={classNames(icon)}
            style={{ color, width: size, height: size, ...(style ?? {}) }}
        />
    );
}
