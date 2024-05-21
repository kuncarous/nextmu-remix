import { Stepper } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export enum UpdateSteps {
    Create,
    Edit = Create,
    Upload,
    Publish,
}

interface IUpdateStepper {
    currentStep: UpdateSteps;
    alternative?: boolean;
    published?: boolean;
}
export const UpdateStepper = ({
    currentStep,
    alternative,
    published,
}: IUpdateStepper) => {
    const { t } = useTranslation();
    return (
        <Stepper active={currentStep}>
            {!alternative && (
                <Stepper.Step
                    label={t('update.steps.first-step.label')}
                    description={t('update.steps.create.description')}
                />
            )}
            {alternative && (
                <Stepper.Step
                    label={
                        published
                            ? t('update.steps.final-step.label')
                            : t('update.steps.first-step.label')
                    }
                    description={t('update.steps.edit.description')}
                />
            )}
            {!published && (
                <Stepper.Step
                    label={t('update.steps.second-step.label')}
                    description={t('update.steps.upload.description')}
                />
            )}
            {!published && (
                <Stepper.Step
                    label={t('update.steps.final-step.label')}
                    description={t('update.steps.publish.description')}
                />
            )}
        </Stepper>
    );
};
