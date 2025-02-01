import * as React from 'react';
import { Form } from 'react-final-form';

import { TextField, makeRequired, makeValidate } from 'mui-rff';
import Stack from '@mui/material/Stack';

import * as Yup from 'yup';
import AutoSave from './AutoSave';

export interface TopFormData {
    water: number;
    kg: number;
    decantTo: number;
}

export interface TopFormProps {
    guidingHand: (values: TopFormData) => void;
    water: number;
    kg: number;
    decantTo: number;
}

const schema = Yup.object({
    water: Yup.number().required(),
    kg: Yup.number().required(),
    decantTo: Yup.number().required(),
});

const TopForm: React.FC<TopFormProps> = ({ guidingHand, water, kg, decantTo }) => {
    const validate = makeValidate(schema);
    const required = makeRequired(schema);

    return (
        <Form
            validate={validate}
            required={required}
            initialValues={{ water, kg, decantTo }}
            onSubmit={(_v) => { }}
            render={({ handleSubmit }) => {
                const handleSave = async (values: TopFormData): Promise<void> => {
                    guidingHand(values);
                    return Promise.resolve();
                };

                const saveIf = (values: TopFormData): boolean => {
                    return values.water >= 0 && values.kg > 0;
                };

                return (
                    <div>
                        {/* autosave on a 250ms debounce when `saveIf` */}
                        <AutoSave onSave={handleSave} saveCv={saveIf} debouncePeriod={250} />

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={1}>
                                <TextField
                                    label="Water (mL)"
                                    id="outlined-number"
                                    name="water"
                                    type="number"
                                />
                                <TextField
                                    label="Weight (kg)"
                                    id="outlined-number"
                                    name="kg"
                                    type="number"
                                />
                                <TextField
                                    label="Decant to (mL)"
                                    id="outlined-number"
                                    name="decantTo"
                                    type="number"
                                />
                            </Stack>
                        </form>
                    </div>
                );
            }}
        />);
}

export default TopForm;
