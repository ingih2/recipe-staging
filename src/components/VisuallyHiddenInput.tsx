import { styled } from "@mui/material";

const VisuallyHiddenInput = styled('input')({
    position: 'absolute',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    height: 1,
    width: 1,
});

export default VisuallyHiddenInput;
