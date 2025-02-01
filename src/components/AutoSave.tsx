import React, { useCallback, useEffect, useState } from "react";
import { FormSpy } from "react-final-form";

interface AutoSaveProps<T> {
    onSave: (values: T) => Promise<void>;
    // Condition variable on whether to save or not
    saveCv: (values: T) => boolean;
    values: T;
    debouncePeriod: number;
}

function AutoSave<T extends {}>(props: AutoSaveProps<T>): null {
    const [timeoutRef, setTimeoutRef] = useState<NodeJS.Timer | null>(null);
    const [, setValues] = useState(props.values);
    const [promise, setPromise] = useState<Promise<void> | null>(null);

    const save = useCallback(async () => {
        if (promise) await promise;
        // Save values if the condition on the values is met
        if (!props.saveCv(props.values)) return;
        setValues(props.values);
        const saving = props.onSave(props.values);
        setPromise(saving);
        await saving;
        setPromise(null);
    }, [props.onSave, props.values]);

    useEffect(() => {
        if (timeoutRef) {
            // Reinterpret as timeout (TODO fault probably lies earlier) and cancel
            const timeoutId = timeoutRef as NodeJS.Timeout;
            clearTimeout(timeoutId);
        }
        setTimeoutRef(setTimeout(save, props.debouncePeriod));
    }, [props.debouncePeriod, props.values]);

    // submitting state, no real rendering
    return null;
}

/**
 * AutoSave automatically calls save after a debounce period.
 * 
 * Based on https://github.com/final-form/react-final-form/tree/main/examples/auto-save-with-debounce
 */
export default function <T extends {}>(props: Omit<AutoSaveProps<T>, "values">) {
    return (
        <FormSpy subscription={{ values: true }}>
            {({ values }: { values: T }) => <AutoSave values={values} {...props} />}
        </FormSpy>
    );
}
