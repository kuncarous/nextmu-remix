import { Flex } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const EmptyVersionList = () => {
    const { t } = useTranslation();
    return (
        <Flex className="select-none grow" justify="center" align="center">
            {t('dashboard.updates.list.empty')}
        </Flex>
    );
};
