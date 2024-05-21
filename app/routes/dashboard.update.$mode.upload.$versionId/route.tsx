import {
    Alert,
    Button,
    Divider,
    Flex,
    Loader,
    Progress,
    UnstyledButton,
    rem,
} from '@mantine/core';
import { LoaderFunctionArgs, json } from '@remix-run/node';
import { StatusCodes } from 'http-status-codes';
import {
    ChangeEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { clientOnly$, serverOnly$ } from 'vite-env-only';
import { UpdateStepper, UpdateSteps } from '~/components/update-stepper';
import {
    ChunkSize,
    MaxParallelChunks,
    MaximumFileSize,
    MinimumFileSize,
    UpdateServices,
    getUpdateService,
} from '~/consts/update';
import {
    getAccessToken,
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import { fetchVersion } from '~/services/grpc/update.server';
import { parseGrpcErrorIntoJsonResponse } from '~/utils/grpc.server';

import { ClientOnly } from 'remix-utils/client-only';

import { useParams } from '@remix-run/react';
import { IconAlertCircle, IconFileUpload } from '@tabler/icons-react';
import { createSHA256 } from 'hash-wasm';
import { ObjectId } from 'mongodb';
import wretch from 'wretch';
import AbortAddon from 'wretch/addons/abort';
import { ChunkInfo__Output } from '~/proto/nextmu/v1/ChunkInfo';
import { StartUploadVersionResponse__Output } from '~/proto/nextmu/v1/StartUploadVersionResponse';
import { UploadVersionChunkResponse__Output } from '~/proto/nextmu/v1/UploadVersionChunkResponse';
import { bytesToBase64 } from '~/utils/base64';
import { formatSize } from '~/utils/format';
import { IStartUploadVersion } from '../api.update.start-upload';
import { IUploadVersionChunk } from '../api.update.upload-chunk';

const requestClient = clientOnly$(
    wretch(`${window.location.protocol}//${window.location.host}`).addon(
        AbortAddon(),
    ),
);
const requiredRole = serverOnly$('update:edit');

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { mode, versionId } = params;
    if (
        !mode ||
        UpdateServices.find((s) => s.value === mode) == null ||
        versionId == null ||
        ObjectId.isValid(versionId) == false
    ) {
        throw new Response(null, {
            status: StatusCodes.NOT_FOUND,
            statusText: 'Not Found',
        });
    }

    const accessToken = await getAccessToken(request);
    if (accessToken == null) {
        return redirectToLogin(request);
    }

    const user = await getPublicUserInfoFromSession(request);
    if (user != null && !('roles' in user)) return user;
    if (user == null) {
        return redirectToLogin(request);
    }
    if (user.roles.includes(requiredRole!) === false) {
        throw new Response(null, {
            status: StatusCodes.UNAUTHORIZED,
            statusText: 'Unauthorized',
        });
    }

    const updateService = await getUpdateService!(mode);
    if (updateService == null) {
        throw new Response(null, {
            status: StatusCodes.SERVICE_UNAVAILABLE,
            statusText: 'Service Unavailable',
        });
    }

    const [error, version] = await fetchVersion(
        versionId,
        updateService,
        accessToken,
    );
    if (error) {
        return parseGrpcErrorIntoJsonResponse(error);
    }

    return json(version);
}

enum UploadVersionFileState {
    ChooseFile,
    CalculateHash,
    StartUpload,
    UploadChunks,
    Finished,
}

enum UploadVersionErrorState {
    None,
    MinimumFileSize,
    MaximumFileSize,
}

function ClientOnlyPage() {
    const { t } = useTranslation();
    const { mode, versionId } = useParams();
    const ref = useRef<HTMLInputElement>(null);

    const [state, setState] = useState<UploadVersionFileState>(
        UploadVersionFileState.ChooseFile,
    );
    const [error, setError] = useState<UploadVersionErrorState>(
        UploadVersionErrorState.None,
    );

    const [file, setFile] = useState<File | null>(null);
    const [fileSize, setFileSize] = useState(0);
    const [fileHash, setFileHash] = useState('');
    const [processedSize, setProcessedSize] = useState(0);
    const progress = useMemo(
        () => (processedSize / fileSize) * 100,
        [fileSize, processedSize],
    );

    const [uploadId, setUploadId] = useState<string | null>(null);
    const [concurrentId, setConcurrentId] = useState<string | null>(null);
    const [uploadedChunks, setUploadedChunks] = useState<ChunkInfo__Output[]>(
        [],
    );

    const onStartUploadVersion = useCallback(
        async (hash: string, fileSize: number, controller: AbortController) => {
            try {
                const response = await requestClient!
                    .signal(controller)
                    .post(
                        {
                            mode,
                            versionId,
                            hash,
                            type: 'application/zip',
                            chunkSize: ChunkSize,
                            fileSize: fileSize,
                        } as IStartUploadVersion,
                        '/api/update/start-upload',
                    )
                    .json<StartUploadVersionResponse__Output>();

                setUploadId(response.uploadId);
                setConcurrentId(response.concurrentId);
                setProcessedSize(
                    response.existingChunks.reduce((p, c) => p + c.size, 0),
                );
                setUploadedChunks(
                    response.existingChunks.map((c) => ({
                        offset: c.offset * ChunkSize,
                        size: c.size * ChunkSize,
                    })),
                );
                setState(UploadVersionFileState.UploadChunks);
            } catch (error) {
                setState(UploadVersionFileState.ChooseFile);
            }
        },
        [],
    );

    const onUploadVersionChunk = useCallback(
        async (
            uploadId: string,
            concurrentId: string,
            offset: number,
            data: Uint8Array,
            controller: AbortController,
        ) => {
            const response = await requestClient!
                .signal(controller)
                .post(
                    {
                        mode,
                        uploadId,
                        concurrentId,
                        offset,
                        data: bytesToBase64(data),
                    } as IUploadVersionChunk,
                    '/api/update/upload-chunk',
                )
                .json<UploadVersionChunkResponse__Output>();
            setProcessedSize((processedSize) => (processedSize += ChunkSize));
        },
        [],
    );

    const onOpenFile = useCallback(() => {
        ref.current?.click();
    }, [ref.current]);

    const onFileChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0] ?? null;
            setError(UploadVersionErrorState.None);
            setFile(file);
            if (file != null) {
                setFileSize(file.size);
                setState(UploadVersionFileState.CalculateHash);
            }
        },
        [ref.current, setState, setFile],
    );

    const onCalculateHash = useCallback(
        async (readStream: ReadableStreamDefaultReader<Uint8Array>) => {
            const algorithm = await createSHA256();
            try {
                do {
                    const chunk = await readStream.read();
                    if (chunk.value != null && chunk.value.byteLength > 0) {
                        const chunkSize = chunk.value.byteLength;
                        setProcessedSize((value) => value + chunkSize);
                        algorithm.update(chunk.value);
                    }
                    if (chunk.done) break;
                } while (true);

                if (file == null) return;
                setProcessedSize(0);
                setFileHash(algorithm.digest());
                setState(UploadVersionFileState.StartUpload);
            } catch (e) {
                setState(UploadVersionFileState.ChooseFile);
            }
        },
        [file, setState, setProcessedSize, setFileHash],
    );

    const onUploadChunks = useCallback(
        async (
            readStream: ReadableStreamDefaultReader<Uint8Array>,
            controller: AbortController,
        ) => {
            interface IChunk {
                offset: number;
                chunk: Uint8Array;
            }

            const chunks: IChunk[] = [];
            const promises: Promise<void>[] = [];

            const uploadChunks = async () => {
                if (chunks.length === 0) return;
                let index = 0;
                for (
                    ;
                    index < chunks.length &&
                    promises.length < MaxParallelChunks;
                    ++index
                ) {
                    const chunk = chunks[index];
                    if (
                        uploadedChunks.find(
                            (c) =>
                                c.offset <= chunk.offset &&
                                c.offset + c.size >= chunk.offset,
                        ) != null
                    ) {
                        setProcessedSize(
                            (processedSize) => (processedSize += ChunkSize),
                        );
                        continue;
                    }

                    const promise = onUploadVersionChunk(
                        uploadId!,
                        concurrentId!,
                        Math.ceil(chunk.offset / ChunkSize),
                        chunk.chunk,
                        controller,
                    );
                    promise.then(
                        () => promises.splice(promises.indexOf(promise), 1),
                        () => promises.splice(promises.indexOf(promise), 1),
                    );
                    promises.push(promise);
                }
                if (index > 0) chunks.splice(0, index);
                if (promises.length >= MaxParallelChunks) {
                    await Promise.any([...promises]);
                }
            };

            try {
                let readOffset = 0,
                    chunkOffset = 0;
                let tempChunk = new Uint8Array();
                do {
                    const result = await readStream.read();
                    if (result.value != null) {
                        let readChunk = result.value;
                        while (readChunk.byteLength > 0) {
                            const chunkSize = readChunk.byteLength;
                            const currentSize = tempChunk.byteLength;
                            const missingSize =
                                ChunkSize - tempChunk.byteLength;
                            const availableSize = Math.min(
                                missingSize,
                                chunkSize,
                            );

                            const tmp = tempChunk;
                            tempChunk = new Uint8Array(
                                currentSize + availableSize,
                            );
                            tempChunk.set(tmp);
                            tempChunk.set(
                                readChunk.slice(0, availableSize),
                                currentSize,
                            );
                            if (tempChunk.byteLength >= ChunkSize) {
                                chunks.push({
                                    offset: chunkOffset,
                                    chunk: tempChunk,
                                });
                                chunkOffset += ChunkSize;
                                tempChunk = new Uint8Array();
                            }

                            readOffset += availableSize;
                            readChunk = readChunk.slice(availableSize);
                        }
                    }

                    if (result.done && tempChunk.byteLength > 0) {
                        chunks.push({
                            offset: chunkOffset,
                            chunk: tempChunk,
                        });
                        chunkOffset += tempChunk.byteLength;
                    }

                    await uploadChunks();
                    if (result.done) break;
                } while (true);

                while (chunks.length > 0) {
                    await uploadChunks();
                }
                if (promises.length > 0) await Promise.all([...promises]);
            } catch (e) {
                setState(UploadVersionFileState.ChooseFile);
            }
        },
        [uploadId, concurrentId],
    );

    useEffect(() => {
        switch (state) {
            case UploadVersionFileState.CalculateHash: {
                if (file == null) return;

                if (
                    file.size < MinimumFileSize ||
                    file.size > MaximumFileSize
                ) {
                    if (file.size < MinimumFileSize)
                        setError(UploadVersionErrorState.MinimumFileSize);
                    else setError(UploadVersionErrorState.MaximumFileSize);
                    setFile(null);
                    setState(UploadVersionFileState.ChooseFile);
                    return;
                }

                const readStream = file.stream().getReader();
                onCalculateHash(readStream);

                return () => {
                    readStream.cancel();
                };
            }

            case UploadVersionFileState.StartUpload: {
                const controller = new AbortController();
                onStartUploadVersion(fileHash, fileSize, controller);
                return () => controller.abort();
            }

            case UploadVersionFileState.UploadChunks: {
                if (file == null) {
                    setState(UploadVersionFileState.ChooseFile);
                    return;
                }

                const readStream = file.stream().getReader();
                const controller = new AbortController();
                onUploadChunks(readStream, controller);
                return () => {
                    readStream.cancel();
                    controller.abort();
                };
            }
        }
    }, [state]);

    return (
        <Flex className="grow p-4" direction="column">
            <div className="flex flex-col px-8 pt-4 w-full">
                <UpdateStepper currentStep={UpdateSteps.Upload} />
            </div>
            <Flex className="grow mt-16" direction="column" gap={rem(8)}>
                <Flex className="flex flex-grow flex-col justify-between gap-3">
                    <Flex
                        className="gap-3 grow self-center justify-center w-[48rem] max-w-[80vw]"
                        direction="column"
                    >
                        {error === UploadVersionErrorState.MinimumFileSize && (
                            <Alert
                                variant="light"
                                color="rgb(255,51,51)"
                                title={t(
                                    'dashboard.updates.upload.error.minimum-size.title',
                                )}
                                icon={<IconAlertCircle />}
                            >
                                {t(
                                    'dashboard.updates.upload.error.minimum-size.text',
                                    { size: formatSize(MinimumFileSize) },
                                )}
                            </Alert>
                        )}
                        {error === UploadVersionErrorState.MaximumFileSize && (
                            <Alert
                                variant="light"
                                color="rgb(255,51,51)"
                                title={t(
                                    'dashboard.updates.upload.error.maximum-size.title',
                                )}
                                icon={<IconAlertCircle />}
                            >
                                {t(
                                    'dashboard.updates.upload.error.maximum-size.text',
                                    { size: formatSize(MaximumFileSize) },
                                )}
                            </Alert>
                        )}
                        {state == UploadVersionFileState.ChooseFile && (
                            <>
                                <input
                                    ref={ref}
                                    className="hidden"
                                    type="file"
                                    accept=".zip, application/zip"
                                    onChange={onFileChange}
                                />
                                <UnstyledButton
                                    className="flex flex-col gap-4 justify-center items-center !px-4 !py-[5rem] !border-2 !border-dashed !border-sky-600 !text-sky-700 hover:!border-sky-400 hover:!text-sky-500"
                                    onClick={onOpenFile}
                                >
                                    <IconFileUpload />
                                    <span>
                                        {t(
                                            'dashboard.updates.upload.upload.label',
                                        )}
                                    </span>
                                </UnstyledButton>
                            </>
                        )}
                        {state == UploadVersionFileState.CalculateHash && (
                            <>
                                <span className="text-center">
                                    {t(
                                        'dashboard.updates.upload.calculate-hash.text',
                                    )}
                                </span>
                                <Progress value={progress} />
                            </>
                        )}
                        {state == UploadVersionFileState.StartUpload && (
                            <>
                                <span className="text-center">
                                    {t(
                                        'dashboard.updates.upload.start-upload.text',
                                    )}
                                </span>
                            </>
                        )}
                        {state == UploadVersionFileState.UploadChunks && (
                            <>
                                <span className="text-center">
                                    {t(
                                        'dashboard.updates.upload.upload-chunks.text',
                                    )}
                                </span>
                                <Progress value={progress} />
                            </>
                        )}
                    </Flex>
                    <Divider className="my-2" />
                    <Button
                        className="self-end"
                        type="submit"
                        disabled={state !== UploadVersionFileState.Finished}
                    >
                        {t('dashboard.updates.upload.next.label')}
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default function Page() {
    return (
        <ClientOnly
            fallback={
                <div className="flex grow flex-col justify-center items-center">
                    <Loader />
                </div>
            }
        >
            {() => <ClientOnlyPage />}
        </ClientOnly>
    );
}
