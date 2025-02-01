import * as React from 'react';
import Toolbar from '@mui/material/Toolbar';

import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import { Box, Button, ButtonGroup, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip } from '@mui/material';
import Blender from '@mui/icons-material/Blender'
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { HorizontalRule, InfoRounded, ReportProblemRounded, UploadFileRounded } from '@mui/icons-material';

import * as LocalData from './utils';
import RoundedBox from './components/RoundedBox';
import Factor, { DEFAULT_FACTOR_DATA, FactorData } from './components/Factor';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { DATAGRIDCOLS, generateGridRowsProp } from './DataGrid';
import TopForm, { TopFormData } from './components/TopForm';
import { jsonToURI } from './JsonUtils';
import VisuallyHiddenInput from './components/VisuallyHiddenInput';

/**
 * App Activity Region Props
 */
interface AARProps {
  initialValues?: LocalData.FormSelections;
}

/**
 * AppActivityRegion
 *
 * This encompasses most of the meaningful elements of the screen
 * That is, it doesn't handle top-bar navigation. That's pretty much it.
 *
 * Note: I don't really know any React/web convention, so this is probably pretty bad practice
 */
class AppActivityRegion extends React.Component<AARProps, {
  // The number of formula entries that are possibly-valid
  plausibleEntries: number,
  // The `Factor` (Form-type) components used for data input
  factorForms: JSX.Element[],
  // The last valid submission from each child form, for each child form
  lastSubmission: FactorData[],
  topForm: JSX.Element,
  water: number,
  kg: number,
  decantTo: number,
}> {
  private childFormHandler = (formKey: number) => {
    return (values: FactorData) => {
      this.state.lastSubmission[formKey] = values;
      console.log(this.state.lastSubmission);

      // This handles updating other panels; it's pretty stupid but hey if it works it works.
      this.forceUpdate();
    };
  }

  private newEntryPanel = (index: number): JSX.Element => {
    return <Factor key={"pan" + index.toString()} guidingHand={this.childFormHandler(index)} />;
  }

  private newEntryPanelWithVals = (index: number, initialData: FactorData) => {
    return <Factor key={"pan" + index.toString()} guidingHand={this.childFormHandler(index)}
      type={initialData.type}
      subtype={initialData.subtype}
      mL={initialData.mL}
      g={initialData.g}
      pd={initialData.pd}
    />;
  }

  componentDidMount() {
    window.onbeforeunload = function (e: BeforeUnloadEvent) {
      e.preventDefault();
    };
  }

  componentWillUnmount() {
    window.onbeforeunload = null;
  }

  constructor(props: AARProps) {
    super(props);

    // This is the most logical initial state.
    this.state = {
      plausibleEntries: 1,
      factorForms: [this.newEntryPanel(0)],
      lastSubmission: [DEFAULT_FACTOR_DATA],
      topForm: <TopForm guidingHand={this.topFormHandler} water={0} kg={0} decantTo={0} />,
      water: 0,
      kg: 0,
      decantTo: 0,
    };
  }

  /**
   * Adds another formula to the entry panel.
   * This is the callback of the "Add" button in the current implementation of the interface.
   */
  incrementFormulaCt() {
    // Update relevant state
    // The max index is used as the key for the new entry panel, this makes naive logic simpler.
    this.state.factorForms.push(this.newEntryPanel(this.state.plausibleEntries));
    this.state.lastSubmission.push(DEFAULT_FACTOR_DATA);
    // Then, we can finally update plausible entry count
    this.setState({ plausibleEntries: (this.state.plausibleEntries + 1) });
  }

  /**
   * Removes the last added formula from the entry panel.
   * This is the callback of the "Subtract" button in the current implementation of the interface.
   */
  decrementFormulaCt() {
    // Sanity check -- we never want to remove our first entry.
    if (this.state.plausibleEntries <= 1) return;

    // Update relevant state
    this.state.factorForms.pop();
    this.state.lastSubmission.pop();
    this.setState({ plausibleEntries: (this.state.plausibleEntries - 1) });
  }

  private renderFormRegion() {
    let ret: JSX.Element[] = [];

    for (let n = 0; n < this.state.plausibleEntries; ++n) {
      ret.push(
        <>
          <Typography variant="h5"> Formula {n + 1}  </Typography>
          <HorizontalRule />
          {this.state.factorForms[n]}
          {(n + 1 === this.state.plausibleEntries) ? <p /> : <p />}
        </>
      );
    }

    ret.push(
      <div style={{ textAlign: 'center' }}>
        <ButtonGroup variant="contained" color="secondary" aria-label="Basic button group">
          <Tooltip title="Add another formula">
            <Button onClick={() => { this.incrementFormulaCt() }}>Add</Button>
          </Tooltip>

          <Tooltip title="Remove a formula">
            <Button onClick={() => { this.decrementFormulaCt() }}>Remove</Button>
          </Tooltip>
        </ButtonGroup>
      </div>
    );

    return ret;
  }

  private dataGridToAsciiTable(
    columns: GridColDef[],
    rows: GridRowsProp
  ) {
    const headers = columns.map(col => col.headerName || col.field);
    const fieldNames = columns.map(col => col.field);
    const allData = rows.map(row => 
      fieldNames.map(field => String(row[field] ?? ''))
    );

    // Calculate column widths including header lengths
    const colWidths = columns.map((_, i) => {
      const headerLength = headers[i].length;
      const dataLength = Math.max(...allData.map(row => row[i].length));
      return Math.max(headerLength, dataLength);
    });

    // Create horizontal border
    const border = colWidths.map(w => '-'.repeat(w + 2)).join('+');

    // Build header row
    const headerRow = headers
      .map((header, i) => ` ${header.padEnd(colWidths[i])} `)
      .join('|');

    // Build data rows with double spacing
    const dataRows = allData.map(row =>
      row
        .map((cell, i) => ` ${cell.padEnd(colWidths[i])} `)
        .join('|')
    );

    // Combine all elements with double newlines between data rows
    return [
      `${headerRow}\n${border}`,
      ...dataRows
    ].join('\n\n'); // Double newline creates empty row spacing
  }

  private renderSidebarRegion() {
    let ret: JSX.Element[] = [];
    let gridRows = generateGridRowsProp(this.state.lastSubmission, this.state.water, this.state.kg, this.state.decantTo);
    let asciiData = this.dataGridToAsciiTable(DATAGRIDCOLS, gridRows);
    ret.push(<Typography variant="h5">Summary (interactive)</Typography>);
    ret.push(<HorizontalRule />);
    ret.push(
      <div style={{ height: 'fit-content', overflow: "auto" }}>
        <DataGrid rows={gridRows} columns={DATAGRIDCOLS} autoHeight hideFooter />
      </div>
    );
    ret.push(<p />);
    ret.push(<Typography variant="h5">Copiable text summary (WIP)</Typography>);
    ret.push(<HorizontalRule />);
    ret.push(<RoundedBox>{asciiData.split('\n').map((line, index) => (
      <>
        {line}
        <br />
      </>
    ))}</RoundedBox>);
    return ret;
  }

  private topFormHandler = (values: TopFormData) => {
    this.setState({ water: values.water, kg: values.kg, decantTo: values.decantTo });
    this.forceUpdate();
  }

  private renderTopRegion() {
    return (<div>
      {this.state.topForm}
    </div>);
  }

  private saveForExport = (): object => {
    // Honestly, not sure if destructuring here is "good", but surely it's not that bad.
    const { factorForms, topForm, ...stateMinusForms } = this.state;
    return stateMinusForms;
  }

  private cautiousRestore = (obj: any): void => {
    // exclude annotation probably not needed anymore
    const ensureHas = (item: Exclude<any, string>, str: string): boolean => Object.prototype.hasOwnProperty.call(item, str);
    if (!(ensureHas(obj, "plausibleEntries") && ensureHas(obj, "water") && ensureHas(obj, "kg") && ensureHas(obj, "lastSubmission"))) return;
    const count: number = obj.plausibleEntries;
    this.setState({ plausibleEntries: count, water: obj.water, topForm: <TopForm guidingHand={this.topFormHandler} water={obj.water} kg={obj.kg} decantTo={obj.decantTo} /> });
    // Set last submissions and factor forms according to specification (suppose data is "probably valid")
    this.state.factorForms.length = this.state.lastSubmission.length = count;

    for (let i = 0; i < count; ++i) {
      if (
        !(i < 0 || i > count) &&
        ensureHas(obj.lastSubmission, "length") &&
        obj.lastSubmission.length == count &&
        ["type", "subtype", "mL", "g"].every(key => ensureHas(obj.lastSubmission[i], key))
      ) {
        this.state.lastSubmission[i] = obj.lastSubmission[i] as FactorData;
        this.state.factorForms[i] = this.newEntryPanelWithVals(i, this.state.lastSubmission[i]);
      } else {
        // Could not determine desired data
        this.state.lastSubmission[i] = DEFAULT_FACTOR_DATA;
        this.state.factorForms[i] = this.newEntryPanel(i);
      }
    }
  }

  render() {
    return (
      <div>
        <AppBar position="static">
          <Toolbar>
            <IconButton color="inherit" aria-label="Blender icon" disableRipple>
              <Blender />
            </IconButton>
            <Typography variant="h4" className="title" noWrap>
              Renal Formula Calculator
            </Typography>

            <div style={{ marginLeft: 'auto', marginRight: 0 }}>
              <ImportExportDialog
                getStateObject={this.saveForExport}
                useImportedStateObject={this.cautiousRestore}
              />
              <Tooltip title="Report a problem">
                <IconButton color="inherit" aria-label="Simple icon button"
                  href="mailto:academe.ragouts_0l@icloud.com?subject=Renal%20Formula%20Calculator:%20[DESCRIBE%20THE%20ISSUE]&body=%0A%0A(Note:%20Don't%20worry%20if%20the%20recipient%20address%20looks%20weird,%20it%20is%20anonymized%20for%20privacy%20and%20automatic%20filtering)"
                  target="_blank"> <ReportProblemRounded />
                </IconButton>
              </Tooltip>
              <AboutDialog />
            </div>
          </Toolbar>
        </AppBar>

        <Container maxWidth={false}>
          <p />
          <div>
            <Box sx={{ display: 'grid', gridAutoFlow: 'dense', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1' }}>
              <RoundedBox sx={{ gridColumn: 'span 3', gridRow: '1' }}> {this.renderTopRegion()} </RoundedBox>
              <RoundedBox sx={{ gridColumn: '1', gridRow: '2 / 3', maxWidth: '67vw' }}> {this.renderFormRegion()} </RoundedBox>
              <RoundedBox sx={{ gridColumn: '2', gridRow: '2 / 3', maxWidth: '50vw' }}> {this.renderSidebarRegion()} </RoundedBox>
            </Box>
          </div>

        </Container>
      </div>
    );
  }
}

interface ImportExportDialogProps {
  getStateObject: () => any;
  useImportedStateObject: (obj: any) => void;
}

const ImportExportDialog: React.FC<ImportExportDialogProps> = ({ getStateObject, useImportedStateObject }) => {
  const [open, setOpen] = React.useState(false);

  const [fileContent, setFileContent] = React.useState(null);
  const [fileName, setFileName] = React.useState("");

  const fileInput = React.useRef(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event.target) {
          const json = JSON.parse(event.target.result as string);
          // note: this is not just the filename
          setFileName(file.name + " (" + file.size + " B)");
          setFileContent(json);
        }
      } catch (error) {
        console.error('Error parsing JSON file: ', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Tooltip title="Import/Export">
        <IconButton color="inherit" aria-label="Simple icon button" onClick={() => setOpen(true)} > <UploadFileRounded /> </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Import / Export"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Importing or exporting your data means you can save your working session and return to it later. A small text file is downloaded to or uploaded from your computer, don't lose it!
          </DialogContentText>

          <br />

          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
          >
            Import (upload file)
            <VisuallyHiddenInput type="file" ref={fileInput} onChange={handleFileUpload} accept=".json" />
          </Button>
          {fileContent && " " + fileName}

          {/* for debugging */}
          {/* {fileContent && <pre>{JSON.stringify(fileContent, null, 2)}</pre>} */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            if (fileContent) {
              useImportedStateObject(fileContent);
            }
          }} disabled={fileContent == null}>
            Import loaded session
          </Button>
          <Button onClick={() => { }} href={jsonToURI(getStateObject())} download={"rfc_session.json"}>
            Export current data
          </Button>
          <Button onClick={() => setOpen(false)} autoFocus>
            Close popup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}


const AboutDialog = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Tooltip title="About this site">
        <IconButton color="inherit" aria-label="Simple icon button" onClick={() => setOpen(true)} > <InfoRounded /> </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"About"}
        </DialogTitle>
        <DialogContent id="alert-dialog-description">
          <DialogContentText>
            This site helps calculate the nutrition of formulas for pediatric patients on dialysis and children with kidney disease.
            The interface is similar to an Excel spreadsheet, and hopefully carries lower risk of misuse or data damage.
            <br />
            This website was created by <a href="https://www.linkedin.com/in/ingibhelgason" target="_blank">Ingi Helgason</a> using React.
          </DialogContentText>
          <DialogTitle> Disclaimer </DialogTitle>
          <DialogContentText>

            This site is a work-in-progress and intended for informational purposes. It is provided 'as-is' and without any explicit claims of quality. Whether you are a healthcare professional or a patient, exercise caution, rely on your judgment, and consult authoritative resources when necessary.
            The nutritional data comes from original sources and has undergone professional review. While believed to be accurate, it is not currently published and may be subject to further review.
            <br /> This disclaimer has not been reviewed by a legal professional.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} autoFocus>
            Close popup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}


/**
 * This defines the main application component.
 *
 * @returns application component.
 */
export default function App() {
  return (
    <AppActivityRegion />
  );
}
