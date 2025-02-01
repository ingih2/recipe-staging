"""
"we have templates at home"
"""

import pandas as pd
from re import sub

df = pd.read_csv("data/dbtagged.csv", sep=",")

# reshape dropping column "1" (excel export artifact lol)
df = df.iloc[:, [j for j, c in enumerate(df.columns) if 1 != j]]

# Map human column names to the property names used for the TS objects
mapper_cols = {
    "Names (per mL)": "name",
    "Calories": "cal_per_unit",
    "Protein": "protein_per_unit",
    "Calcium": "calcium_per_unit",
    "Phos": "phos_per_unit",
    "K+": "kalium_per_unit",
    "Na+": "natrium_per_unit",
    "Mg": "magnesium_per_unit",
    "Retinol (IU)": "retinol_per_unit",
    "Vit D (IU)": "vit_d_per_unit",
    "Carb": "carb_per_unit",
    "Fat": "fat_per_unit",
    "d/p": "displacement",
    # as is, ignore rest.
}


# Turn a generic string of words into a snake case variable name
def transmute_snake(s: str) -> str:
    return "_".join(
        sub(
            "([A-Z][a-z]+)",
            r" \1",
            sub("([A-Z]+)", r" \1", sub(r"[()]", "", s).replace("-", " ")),
        ).split()
    ).lower()


df.rename(columns=mapper_cols, inplace=True)
old_names = df["name"].copy().tolist()
df["name"] = df["name"].apply(transmute_snake)

# Check if the names are unique under this new mapping
uniqueness_met_in_keys = df["name"].is_unique
assert uniqueness_met_in_keys

prelude = """
export interface FormSelections {
    type: string;
    subtype: string;
    mL: number;
    g: number;
}

export interface IDBEntry {
    cal_per_unit: number;
    protein_per_unit: number;
    calcium_per_unit: number;
    phos_per_unit: number;
    kalium_per_unit: number;
    natrium_per_unit: number;
    magnesium_per_unit: number;
    retinol_per_unit: number;
    vit_d_per_unit: number;
    carb_per_unit: number;
    fat_per_unit: number;
    displacement: number;
}

export const DEFAULT_FORM_SELECTIONS = {
    type: '',
    subtype: '',
    mL: 0,
    g: 0,
};

export const formulaTypes = [
    { label: 'Choose...', value: '', disabled: true },
    { label: 'Milk', value: 'f1' },
    { label: 'Liquid Pediatric', value: 'f2' },
    { label: 'Powder', value: 'f3' },
    { label: 'Additives (post-decant)', value: 'f4' },
];

"""

formulaSubtypePartials = []
dbEntryPartials = []

for i in range(len(df)):
    s1 = "{ label: '" + old_names[i] + "', value: '" + df["name"][i] + "' },"
    formulaSubtypePartials.append(s1)

    s2 = (
        "'"
        + df["name"][i]
        + "': {"
        + f"""
        cal_per_unit: {df["cal_per_unit"][i]},
        protein_per_unit: {df["protein_per_unit"][i]},
        calcium_per_unit: {df["calcium_per_unit"][i]},
        phos_per_unit: {df["phos_per_unit"][i]},
        kalium_per_unit: {df["kalium_per_unit"][i]},
        natrium_per_unit: {df["natrium_per_unit"][i]},
        magnesium_per_unit: {df["magnesium_per_unit"][i]},
        retinol_per_unit: {df["retinol_per_unit"][i]},
        vit_d_per_unit: {df["vit_d_per_unit"][i]},
        carb_per_unit: {df["carb_per_unit"][i]},
        fat_per_unit: {df["fat_per_unit"][i]},
        displacement: {df["displacement"][i]},
"""
        + "},"
    )
    # patch for ts (where nan -> NaN)
    s2 = sub(r"nan", "NaN", s2)
    dbEntryPartials.append(s2)


formulaSubtypes = f"""
export const formulaSubtypes = [
[
{chr(10).join(formulaSubtypePartials)}
],
[
{chr(10).join(formulaSubtypePartials[0:7])}
],
[
{chr(10).join(formulaSubtypePartials[7:35])}
],
[
{chr(10).join(formulaSubtypePartials[35:59])}
],
[
{chr(10).join(formulaSubtypePartials[59:])}
],
];
"""

db_at_home = "export const db_at_home: { [key: string]: IDBEntry } = {\n"

for i in range(len(dbEntryPartials)):
    db_at_home += "\n" + dbEntryPartials[i]

db_at_home += "\n};"

with open("src/utils.ts", "w") as f:
    f.write(prelude + formulaSubtypes + "\n" + db_at_home + "\n")

print("Successfully wrote updated db to src/utils.ts")
