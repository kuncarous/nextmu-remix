import type { Jsonify } from '@remix-run/server-runtime/dist/jsonify';
import type { Version__Output as Version } from '~/proto/nextmu/v1/Version';

interface IVersionCardProps {
    id: string;
    version: Jsonify<Version>;
}
export const VersionCard = ({ id, version }: IVersionCardProps) => {
    return <></>;
};
