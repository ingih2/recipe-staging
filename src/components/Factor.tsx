import * as React from 'react';
import { Form } from 'react-final-form';

import * as LocalData from '../utils';
import { Select, TextField, Switches, makeRequired, makeValidate } from 'mui-rff';
import Stack from '@mui/material/Stack';

import * as Yup from 'yup';
import { ButtonGroup, Typography } from '@mui/material';
import AutoSave from './AutoSave';

export interface FactorData {
    type?: string;
    subtype?: string;
    mL?: number;
    g?: number;
    pd?: boolean;
}

export const DEFAULT_FACTOR_DATA = {
    type: '',
    subtype: '',
    mL: 0,
    g: 0,
    pd: false,
}

export interface FactorProps {
    guidingHand: (values: FactorData) => void;
    type?: string;
    subtype?: string;
    mL?: number;
    g?: number;
    pd?: boolean;
}

// Validation is not really used but this makes nice messages via `mui-rff` (i think...)
const schema = Yup.object({
    type: Yup.string().required(),
    subtype: Yup.string().required(),
    mL: Yup.number().required(),
    g: Yup.number().required(),
    pd: Yup.boolean().required(),
});

const Factor: React.FC<FactorProps> = ({ guidingHand, type = "", subtype = "", mL = 0, g = 0 }) => {
    const validate = makeValidate(schema);
    const required = makeRequired(schema);

    return (
        <Form
            validate={validate}
            required={required}
            initialValues={{ type, subtype, mL, g }}
            onSubmit={(v) => { }}
            render={({ form, handleSubmit, submitting, pristine, values }) => {
                if (!values) {
                    throw new Error("Values are undefined!");
                }

                const hasType = (values.type != '');
                let idx: number = parseInt(values.type?.[1] ?? '');
                const isLiquid = hasType && (idx === 1) || (idx === 2);
                const isSolid = hasType && (idx === 3 || idx === 4);
                const isValid = hasType && (values.subtype != '') && (isLiquid ? values.mL >= 0 : values.g >= 0);

                const handleSave = async (values: FactorData): Promise<void> => {
                    guidingHand(values);
                    if (hasType && isValid) {
                        form.reset(values);
                    }
                    return Promise.resolve();
                };

                const saveIf = (values: FactorData): boolean => {
                    return isValid;
                };

                return (<div>
                    {/* autosave on a 250ms debounce when `saveIf` */}
                    <AutoSave onSave={handleSave} saveCv={saveIf} debouncePeriod={250} />

                    <form onSubmit={handleSubmit}>
                        {/* TODO different formatting of warning text -- hint? color change? */}
                        {!pristine ? <Typography variant="body2">Please select a type and subtype.<p /> </Typography> : <></>}

                        <Stack spacing={2}>
                            <Select
                                label="Type of Formula"
                                name="type"
                                required
                                data={LocalData.formulaTypes}
                                multiple={false}
                            />
                            <Select
                                label="Subtype"
                                name="subtype"
                                required
                                disabled={!hasType}
                                data={hasType ? LocalData.formulaSubtypes[idx] : LocalData.formulaSubtypes[0]}
                                multiple={false}
                            />
                            <TextField
                                label="Volume (mL)"
                                id="outlined-number"
                                name="mL"
                                type="number"
                                required={isLiquid}
                                disabled={!isLiquid}
                            />
                            <TextField
                                label="Mass (g)"
                                id="outlined-number"
                                name="g"
                                type="number"
                                required={isSolid}
                                disabled={!isSolid}
                            />
                            <Switches
                                label="Post-decant?"
                                name="pd"
                                data={{ label: '', value: 'pd' }}
                            />
                        </Stack>
                    </form>
                </div>
                );
            }}
        />);
}

export default Factor;
