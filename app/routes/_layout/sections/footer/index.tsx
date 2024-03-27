import { useTranslation } from "react-i18next";
import { CopyrightCurrentYear, CopyrightFirstYear } from "~/consts/copyright";
import styles from "./styles.module.css";
import { Text } from "@mantine/core";

export default function Footer() {
    const { t } = useTranslation();
    return (
        <div className={styles.footer}>
            <Text size="sm" ta="center">{t('copyright', { firstYear: CopyrightFirstYear, currentYear: CopyrightCurrentYear })}</Text>
        </div>
    );
}