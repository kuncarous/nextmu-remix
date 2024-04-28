import type { Jsonify } from '@remix-run/server-runtime/dist/jsonify';
import type { Version__Output as Version } from '~/proto/nextmu/v1/Version';

interface IVersionCardProps {
    version: Jsonify<Version>;
}
export const VersionCard = ({ version }: IVersionCardProps) => {
    return <></>;
};
