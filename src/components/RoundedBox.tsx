import * as React from 'react';
import Box, { BoxProps } from "@mui/material/Box";
import { Theme } from '@mui/material';

export default function RoundedBox(props: BoxProps) {
    const { sx, ...other } = props;
    return (
        <Box
            sx={{
                bgcolor: (theme: Theme) => (theme.palette.background.default),
                color: (theme: Theme) => (theme.palette.primary.main),
                border: '2px solid',
                borderColor: '#000',
                p: 1,
                m: 1,
                borderRadius: 2,
                fontSize: '0.875rem',
                fontWeight: '700',
                ...sx,
            }}
            {...other}
        />
    );
}
