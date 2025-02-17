import { GridColDef, GridRowsProp } from "@mui/x-data-grid";
import { FactorData } from "./components/Factor";
import { IDBEntry, db_at_home } from "./utils";

export const DATAGRIDCOLS: GridColDef[] = [
    { field: 'formula_name', headerName: 'Name', width: 125 },
    { field: 'volume', headerName: 'Volume (mL)' },
    { field: 'kcal', headerName: 'Energy (kcal)' },
    { field: 'protein', headerName: 'Protein (g)' },
    { field: 'calcium', headerName: 'Calcium (mg)' },
    { field: 'phosphorus', headerName: 'Phos (mg)' },
    { field: 'kalium', headerName: 'K+ (mg)' },
    { field: 'sodium', headerName: 'Na+ (mg)' },
    { field: 'magnesium', headerName: 'Magnesium (mg)' },
    { field: 'retinol_iu', headerName: 'Retinol (IU)' },  
    { field: 'vit_d_iu', headerName: 'Vit D (IU)' },
    { field: 'carb', headerName: 'Carb (g)' },
    { field: 'fat', headerName: 'Fat (g)' },
];

export const generateGridRowsProp = (factorData: FactorData[], water: number, kg: number, decantTo: number, finalVol: number): GridRowsProp => {
    const factorDataFiltered: FactorData[] = factorData.filter((data) => {
        return data.type !== '' && data.subtype !== '';
    });

    const pre_data: FactorData[] = factorDataFiltered.filter(data => !data.pd);
    const post_data: FactorData[] = factorDataFiltered.filter(data => data.pd);

    // Numerical errors begone, hello (known) numerical errors :>
    if (kg === 0) kg = Number.NaN;
    const totalityMap: Map<string, number> = new Map();

    function addd(key: string, value: number): void {
        totalityMap.set(key, (totalityMap.get(key) || 0) + value);
    }

    function doMetricsAndAddToRows(data: FactorData, index: number) {
        // Key objective: convert the FactorData into a row entry. First, we must do some checks:
        // Determine if this is a solid or a liquid
        // Liquids contribute volume directly
        // Solids contribute some displacement volume (mL . g^(-1))

        // optional was a bad idea
        const i: number = parseInt(data.type?.[1] ?? "0");

        // This forms a near-partition, since we assume things are valid from here
        const isLiquid: boolean = ((i === 1) || (i === 2));

        const dbEntry: IDBEntry = db_at_home[data.subtype!];
        const scaler: number = (isLiquid ? data.mL! : data.g!);

        let volumeScaler: number = (isLiquid ? scaler : scaler * dbEntry.displacement);

        // FIXME(ingi): is this still necessary?
        // Patch for liquid with some solid added as directed, e.g. Similac 60/40 mixture.
        if (isLiquid && dbEntry.displacement > 0) {
            volumeScaler *= (1 + dbEntry.displacement);
        }

        return {
            formula_name: data.subtype,
            id: -1, // ids will be assigned later
            volume: volumeScaler,
            kcal: +(dbEntry.cal_per_unit * scaler).toFixed(3),
            protein: +(dbEntry.protein_per_unit * scaler).toFixed(3),
            calcium: +(dbEntry.calcium_per_unit * scaler).toFixed(3),
            phosphorus: +(dbEntry.phos_per_unit * scaler).toFixed(3),
            kalium: +(dbEntry.kalium_per_unit * scaler).toFixed(3),
            sodium: +(dbEntry.natrium_per_unit * scaler).toFixed(3),
            magnesium: +(dbEntry.magnesium_per_unit * scaler).toFixed(3),
            retinol_iu: +(dbEntry.retinol_per_unit * scaler).toFixed(3),
            vit_d_iu: +(dbEntry.vit_d_per_unit * scaler).toFixed(3),
            carb: +(dbEntry.carb_per_unit * scaler).toFixed(3),
            fat: +(dbEntry.fat_per_unit * scaler).toFixed(3),
        };
    }

    // I am so bad at writing Java/TypeScript
    var pre_result = pre_data.map(doMetricsAndAddToRows);
    const decantable_result = pre_result.reduce((acc, curr) => {
        return {
            formula_name: "Pre-Decant",
            id:           0, // ids will be assigned later
            volume:       +acc.volume + +curr.volume,
            kcal:         +acc.kcal + +curr.kcal,
            protein:      +acc.protein + +curr.protein,
            calcium:      +acc.calcium + +curr.calcium,
            phosphorus:   +acc.phosphorus + +curr.phosphorus,
            kalium:       +acc.kalium + +curr.kalium,
            sodium:       +acc.sodium + +curr.sodium,
            magnesium:    +acc.magnesium + +curr.magnesium,
            retinol_iu:   +acc.retinol_iu + +curr.retinol_iu,
            vit_d_iu:     +acc.vit_d_iu + +curr.vit_d_iu,
            carb:         +acc.carb + +curr.carb,
            fat:          +acc.fat + +curr.fat,
        };
    }, {
            formula_name: "Pre-Decant",
            id:           +0, // ids will be assigned later
            volume:       +water, // important bugfix (2025.02.09)
            kcal:         +0,
            protein:      +0,
            calcium:      +0,
            phosphorus:   +0,
            kalium:       +0,
            sodium:       +0,
            magnesium:    +0,
            retinol_iu:   +0,
            vit_d_iu:     +0,
            carb:         +0,
            fat:          +0,
     });
    pre_result = pre_result.concat(decantable_result);

    const decant_mulby = (decantable_result.volume >= decantTo) ? (decantTo / decantable_result.volume) : 1.0;

    const decanted_result = {
          formula_name: "Post-Decant",
          id:         +0,
          volume:     decantable_result.volume * decant_mulby,
          kcal:       decantable_result.kcal * decant_mulby,
          protein:    decantable_result.protein * decant_mulby,
          calcium:    decantable_result.calcium * decant_mulby,
          phosphorus: decantable_result.phosphorus * decant_mulby,
          kalium:     decantable_result.kalium * decant_mulby,
          sodium:     decantable_result.sodium * decant_mulby,
          magnesium:  decantable_result.magnesium * decant_mulby,
          retinol_iu: decantable_result.retinol_iu * decant_mulby,
          vit_d_iu:   decantable_result.vit_d_iu * decant_mulby,
          carb:       decantable_result.carb * decant_mulby,
          fat:        decantable_result.fat * decant_mulby,
    };
    pre_result = pre_result.concat(decanted_result);

    var post_result = post_data.map(doMetricsAndAddToRows);
    // Compute sum of post-decant and after decanting stages (jank)
    const intermediate = post_result.concat(decanted_result);
    const totals = intermediate.reduce((acc, curr) => {
        return {
            formula_name: "Totals",
            id:           0, // ids will be assigned later
            volume:       +acc.volume + +curr.volume,
            kcal:         +acc.kcal + +curr.kcal,
            protein:      +acc.protein + +curr.protein,
            calcium:      +acc.calcium + +curr.calcium,
            phosphorus:   +acc.phosphorus + +curr.phosphorus,
            kalium:       +acc.kalium + +curr.kalium,
            sodium:       +acc.sodium + +curr.sodium,
            magnesium:    +acc.magnesium + +curr.magnesium,
            retinol_iu:   +acc.retinol_iu + +curr.retinol_iu,
            vit_d_iu:     +acc.vit_d_iu + +curr.vit_d_iu,
            carb:         +acc.carb + +curr.carb,
            fat:          +acc.fat + +curr.fat,
        };
    }, {
            formula_name: "Totals",
            id:            0,
            volume:       +0,
            kcal:         +0,
            protein:      +0,
            calcium:      +0,
            phosphorus:   +0,
            kalium:       +0,
            sodium:       +0,
            magnesium:    +0,
            retinol_iu:   +0,
            vit_d_iu:     +0,
            carb:         +0,
            fat:          +0,
     });
    post_result = post_result.concat(totals);

    const ffv_ratio = (totals.volume >= finalVol) ? (finalVol / totals.volume) : 1.0;
    const finality = {
          formula_name: "Final Prescribed Volume",
          id:         +0,
          volume:     totals.volume * ffv_ratio,
          kcal:       totals.kcal * ffv_ratio,
          protein:    totals.protein * ffv_ratio,
          calcium:    totals.calcium * ffv_ratio,
          phosphorus: totals.phosphorus * ffv_ratio,
          kalium:     totals.kalium * ffv_ratio,
          sodium:     totals.sodium * ffv_ratio,
          magnesium:  totals.magnesium * ffv_ratio,
          retinol_iu: totals.retinol_iu * ffv_ratio,
          vit_d_iu:   totals.vit_d_iu * ffv_ratio,
          carb:       totals.carb * ffv_ratio,
          fat:        totals.fat * ffv_ratio,
    };
    post_result = post_result.concat(finality);
    

    // Fix indices for the final result, so the data is well-defined for table lib
    const real_result = pre_result.concat(post_result).map((item, index) => ({
        ...item,
        id: index,
    }));

    return real_result;
}
