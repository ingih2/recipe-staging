/// Attempted rewrite for cleanliness
/// I think it is stable, but need to do a little bit more testing to make sure.

import { GridColDef, GridRowsProp } from "@mui/x-data-grid";
import { FactorData } from "./components/Factor";
import { IDBEntry, db_at_home } from "./utils";

export const DATAGRIDCOLS: GridColDef[] = [
  { field: "formula_name", headerName: "Name", width: 125 },
  { field: "volume", headerName: "Volume (mL)" },
  { field: "kcal", headerName: "Energy (kcal)" },
  { field: "protein", headerName: "Protein (g)" },
  { field: "calcium", headerName: "Calcium (mg)" },
  { field: "phosphorus", headerName: "Phos (mg)" },
  { field: "kalium", headerName: "K+ (mg)" },
  { field: "sodium", headerName: "Na+ (mg)" },
  { field: "magnesium", headerName: "Magnesium (mg)" },
  { field: "retinol_iu", headerName: "Retinol (IU)" },
  { field: "vit_d_iu", headerName: "Vit D (IU)" },
  { field: "carb", headerName: "Carb (g)" },
  { field: "fat", headerName: "Fat (g)" },
];

interface GridRow {
  formula_name: string;
  id: number;
  volume: number;
  kcal: number;
  protein: number;
  calcium: number;
  phosphorus: number;
  kalium: number;
  sodium: number;
  magnesium: number;
  retinol_iu: number;
  vit_d_iu: number;
  carb: number;
  fat: number;
}

const createEmptyRow = (name: string): GridRow => ({
  formula_name: name,
  id: +0,
  volume: +0,
  kcal: +0,
  protein: +0,
  calcium: +0,
  phosphorus: +0,
  kalium: +0,
  sodium: +0,
  magnesium: +0,
  retinol_iu: +0,
  vit_d_iu: +0,
  carb: +0,
  fat: +0,
});

const scaleRow = (row: GridRow, scale: number): GridRow => ({
  ...row,
  volume: +row.volume * scale,
  kcal: +row.kcal * scale,
  protein: +row.protein * scale,
  calcium: +row.calcium * scale,
  phosphorus: +row.phosphorus * scale,
  kalium: +row.kalium * scale,
  sodium: +row.sodium * scale,
  magnesium: +row.magnesium * scale,
  retinol_iu: +row.retinol_iu * scale,
  vit_d_iu: +row.vit_d_iu * scale,
  carb: +row.carb * scale,
  fat: +row.fat * scale,
});

const takeSum = (rows: GridRow[], name: string): GridRow => {
  const result = createEmptyRow(name);
  return rows.reduce(
    (acc, curr) => ({
      ...acc,
      volume: +Number(acc.volume) + Number(curr.volume),
      kcal: +acc.kcal + curr.kcal,
      protein: +acc.protein + curr.protein,
      calcium: +acc.calcium + curr.calcium,
      phosphorus: +acc.phosphorus + curr.phosphorus,
      kalium: +acc.kalium + curr.kalium,
      sodium: +acc.sodium + curr.sodium,
      magnesium: +acc.magnesium + curr.magnesium,
      retinol_iu: +acc.retinol_iu + curr.retinol_iu,
      vit_d_iu: +acc.vit_d_iu + curr.vit_d_iu,
      carb: +acc.carb + curr.carb,
      fat: +acc.fat + curr.fat,
    }),
    result,
  );
};

const factorDataToRow = (data: FactorData): GridRow => {
  const isLiquid = parseInt(data.type?.[1] ?? "0") <= 2;
  const dbEntry: IDBEntry = db_at_home[data.subtype!];
  const scaler = isLiquid ? data.mL! : data.g!;
  let volumeScaler = isLiquid ? scaler : scaler * dbEntry.displacement;

  if (isLiquid && dbEntry.displacement > 0) {
    volumeScaler *= 1 + dbEntry.displacement;
  }

  return {
    formula_name: data.subtype!,
    id: -1,
    volume: +volumeScaler,
    kcal: +(dbEntry.cal_per_unit * scaler).toFixed(2),
    protein: +(dbEntry.protein_per_unit * scaler).toFixed(2),
    calcium: +(dbEntry.calcium_per_unit * scaler).toFixed(2),
    phosphorus: +(dbEntry.phos_per_unit * scaler).toFixed(2),
    kalium: +(dbEntry.kalium_per_unit * scaler).toFixed(2),
    sodium: +(dbEntry.natrium_per_unit * scaler).toFixed(2),
    magnesium: +(dbEntry.magnesium_per_unit * scaler).toFixed(2),
    retinol_iu: +(dbEntry.retinol_per_unit * scaler).toFixed(2),
    vit_d_iu: +(dbEntry.vit_d_per_unit * scaler).toFixed(2),
    carb: +(dbEntry.carb_per_unit * scaler).toFixed(2),
    fat: +(dbEntry.fat_per_unit * scaler).toFixed(2),
  };
};

export const generateGridRowsProp = (
  factorData: FactorData[],
  water: number,
  kg: number,
  decantTo: number,
  finalVol: number,
): GridRowsProp => {
  const validData = factorData.filter((data) => data.type && data.subtype);
  const preData = validData.filter((data) => !data.pd).map(factorDataToRow);
  const postData = validData.filter((data) => data.pd).map(factorDataToRow);

  // Pre-decant calculations
  const waterRow = { ...createEmptyRow("Water"), volume: water };
  const preDecant = takeSum([...preData, waterRow], "Pre-Decant");

  // Decanted calculations
  const decantRatio =
    preDecant.volume >= decantTo ? decantTo / preDecant.volume : 1.0;
  const postDecant = scaleRow(preDecant, decantRatio);
  postDecant.formula_name = "Post-Decant";

  // Final calculations
  const combinedPost = [...postData, postDecant];
  const totals = takeSum(combinedPost, "Totals");

  // Scale down to final volume used
  const finalRatio = totals.volume >= finalVol ? finalVol / totals.volume : 1.0;
  const final = scaleRow(totals, finalRatio);
  final.formula_name = "Final Prescribed Volume";

  // We must recreate serial ordering (IDs), since it's hard to be sure that we preserved
  // uniqueness between all groups in the previous steps
  return [...preData, preDecant, postDecant, ...postData, totals, final].map(
    (row, index) => ({ ...row, id: index }),
  );
};
