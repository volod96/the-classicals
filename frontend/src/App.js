import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// Material UI Theme provider import (necesarry)
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import * as Colors from 'material-ui/styles/colors';

// Axios import
import axios from 'axios';

// Icons import
import ContentAdd from 'material-ui/svg-icons/content/add';
import ContentEdit from 'material-ui/svg-icons/content/create'
import ContentSave from 'material-ui/svg-icons/content/save';
import ContentCancel from 'material-ui/svg-icons/content/clear';

// MaterialUI imports
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import Snackbar from 'material-ui/Snackbar';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import RaisedButton from 'material-ui/RaisedButton';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

// Description: tables for composers and pieces (with headers as array values and data as array) with:
// - rows for existing data in each table with a delete button and an edit one
// - one row for adding a new entry with textboxes and an add button
// Load: define rows for the data in the props array and the add one at the buttom
// Click on delete: assure that if a column is edited, its state is changed to normal; 
// a function in the main component is handled, that calls axios DELETE request and removes the requested data from the array
// Click on add: assure that if a column is edited, its state is changed to normal; 
// a table function that checks if there are values in each column and if so calls a parent function that calls axios POST request and updates the array gets called
// Click on edit: the state of the column with the given ID is changed (editing = true) and it is rendered with textboxes with object data instead of plain object data;
// a click on apply checks if all columns are not empty and calls through a parent function an axios PUT request.

// Constants for reuse
const BACKEND_SERVER = "https://seminar-tehnologii-web-volod96.c9users.io:8081";
const REQUESTS_SEPARATOR = "_";

// Utility functions
function toArray(object) {
  let keys = Object.keys(object);
  let result = [];
  for(let i = 0; i < keys.length; i++) {
    let key = keys[i];
    result.push({
      [key]: object[key]
    });
    return result;
  }
}

function spacesToSeparator(input, separator) {
if(input !== null) {
  let result = "";
  let lastIndex = 0;
  let currentIndex = input.indexOf(" ", lastIndex);
  while(currentIndex > -1) {
    result += input.substring(lastIndex, currentIndex);
    result += separator;
    lastIndex = currentIndex + 1;
    currentIndex = input.indexOf(" ", lastIndex);
    }
    result += input.substring(lastIndex);
    return result;
    }
    else {
      return null;
  }
} 

function toObject(array) {
  let result = {};
  for(let i = 0; i < array.length; i++) {
    result = Object.defineProperty(result, array[i].trim(), {
      value: null,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
  return result;
}

const AppTheme = getMuiTheme({
  AppBar: {
    backgroundColor: Colors.brown500,
    textAlign: "center"
  }
});

const PageTop = () => {
  return (
    <img src={BACKEND_SERVER + "background-image-top.jpg"}/>   
  );
};

class ComposersTableRow extends Component {
  
  render() {
    let composerKeys = Object.keys(this.props.composer);
    // TODO: Check if ID works
    let composerId = this.props.composer.Id;
    return (
      <TableRow className = {this.props.index % 2 === 0 ? "even-table-row" : "odd-table-row"}>
      {composerKeys.map((key, keyIndex) => {
        if(keyIndex === 0) {
          return (
            <TableRowColumn key={keyIndex}>
              <div className="id-label">
                {this.props.composer[key]}
              </div> 
              {this.props.editingComposerId === -1 
              ?   
                <div className={composerId < 10 ? "one-digit-id-label-edit-button" : "two-digit-id-label-edit-button"}>  
                  <FloatingActionButton mini = {true} onClick = {(event) => this.props.handleComposerEditStart(composerId)}>
                    <ContentEdit />
                  </FloatingActionButton>  
                </div>
              : 
              (this.props.editingComposerId !== composerId 
              ? 
                <span></span>
              :
                <div className={composerId < 10 ? "one-digit-id-label-edit-button" : "two-digit-id-label-edit-button"}>
                  <FloatingActionButton mini = {true}  onClick = {() => this.props.handleComposerEditSave()}>
                    <ContentSave />
                  </FloatingActionButton>
                  <FloatingActionButton mini = {true} onClick = {() => this.props.handleComposerEditCancel()}>
                    <ContentCancel />
                  </FloatingActionButton>  
                </div>)  
              }  
            </TableRowColumn>  
          );
        }
        else {
        return (
          <TableRowColumn key = {keyIndex}>
          {this.props.editingComposerId === composerId 
          ?
              <TextField 
                id = {"Edit" + spacesToSeparator(key, "")} 
                floatingLabelText = {key}
                onChange = {(event, newInput) => this.props.handleComposerTextFieldEdit(event, newInput)}
                defaultValue = {this.props.composer[key]}>
              </TextField>  
          :
              <span>{this.props.composer[key]}</span>
          }
          </TableRowColumn>
        );
      }})}
        {this.props.editingComposerId !== composerId 
        ?
          <TableRowColumn>
            <RaisedButton 
              className = "delete-button"
              label = "Delete"
              secondary = {true}
              onClick = {(id) => this.props.handleComposerDelete(this.props.composer.Id)}>
            </RaisedButton>
          </TableRowColumn>  
        :
          <TableRowColumn />
        }
        </TableRow>
    );
  }
}

class AddComposerTableRow extends Component {
  constructor(props) {
    super(props);
    // Ignoring the delete column
    let noSpaceColumns = [];
    this.props.columns.forEach((column) => {
      if(column.trim().toUpperCase().indexOf("DELETE") === -1) {
        noSpaceColumns.push(spacesToSeparator(column, ""));
      }
    });
    this.state = {
      textFieldsValues: toObject(noSpaceColumns),
      columns: this.props.columns
    };
  }
  
  handleTextFieldInputChange(event, newInput) {
    let textFieldsValues = Object.assign({}, this.state.textFieldsValues);
    let textFieldId = event.target.getAttribute("id");
    textFieldsValues[textFieldId.trim()] = newInput;
    this.setState({
      textFieldsValues: textFieldsValues
    });
  }
  
  resetTextFieldValues() {
    let textFieldsValues = Object.assign({}, this.state.textFieldsValues);
    let keys = Object.keys(textFieldsValues);
    for(let i = 0; i < keys.length; i++) {
      textFieldsValues[keys[i].trim()] = null;
      let textField = keys[i].trim().toUpperCase() !== "ID" ? document.getElementById(keys[i].trim()) : null;
      if(textField !== null) {
        textField.value = null;
      }
    }
    this.setState({
      textFieldsValues: textFieldsValues
    });
  }
  
  handleComposerEditCancel() {
    this.resetFieldValues();
  }
  
  render() {
    let columns = this.state.columns;
    return (
      <TableRow className = {this.props.index % 2 === 0 ? "even-table-row" : "odd-table-row"}>
        {columns.map((column, valIndex) => {
            if(column.trim().toUpperCase() === "ID") {
              return (
                <TableRowColumn key = {valIndex}>
                  <div className="add-button">
                    <FloatingActionButton mini = {true} onClick = {(data, callback) => this.props.handleComposerAdd(this.state.textFieldsValues, this.resetTextFieldValues.bind(this))}>
                      <ContentAdd />
                    </FloatingActionButton>
                  </div>  
                </TableRowColumn> 
              );
            }
            else if(column.trim().toUpperCase().indexOf("DELETE") > -1) {
            return (
                <TableRowColumn key = {valIndex} />
              );  
            }
            else {
              return (
                <TableRowColumn key={valIndex}>
                  <TextField
                    id = {spacesToSeparator(column, "")}
                    floatingLabelText = {column}
                    onChange = {(event, newInput) => this.handleTextFieldInputChange(event, newInput)}>
                  </TextField>  
                </TableRowColumn>  
              );
            }
          })}
      </TableRow>   
    );
  }
}  

const ComposersTableHeader = (props) => {
  return (
    <TableRow>
    {props.columns.map((column, index) => {
      return (
        <TableHeaderColumn key={index}>{column}</TableHeaderColumn>
      );
    })}
    </TableRow>
  );
};

class ComposersTable extends Component {
  constructor(props) {
    super(props);
    let noSpaceColumns = [];
    this.props.columns.forEach((column) => {
      if(column.trim().toUpperCase().indexOf("DELETE") === -1) {
        noSpaceColumns.push(spacesToSeparator(column, ""));
      }
    });
    this.state = {
      editingComposerId: -1,
      editingTextFielsValues: toObject(noSpaceColumns)
    };
  }
  
  handleComposerTextFieldEdit(event, newInput) {
    let editingTextFielsValues = Object.assign({}, this.state.editingTextFielsValues);
    let textFieldId = event.target.getAttribute("id");
    editingTextFielsValues[textFieldId.trim().substring(textFieldId.trim().indexOf("Edit") + 4)] = newInput;
    this.setState({
      editingTextFielsValues: editingTextFielsValues
    });
  }
  
  handleComposerEditStart(id) {
    let editingTextFielsValues = Object.assign({}, this.state.editingTextFielsValues);
    let columns = Object.keys(this.state.editingTextFielsValues);
    let composers = this.props.composers;
    let composer = null;
    for(let i = 0; i < composers.length && !composer; i++) {
      if(composers[i].Id == id) {
        composer = composers[i];
      }
    }
    let composerColumns = Object.keys(composer);
    for(let i = 0; i < columns.length; i++) {
      let column = columns[i];
      let composerColumn = composerColumns[i];
        editingTextFielsValues[column] = composer[composerColumn];
    }
    this.setState({
      editingTextFielsValues: editingTextFielsValues,
      editingComposerId: id
    });
  }
  
  handleComposerEditCancel() {
    this.setState({
      editingComposerId: -1
    });
  }
  
  handleComposerEditSave() {
    console.log("Calling props function with " + JSON.stringify(this.state.editingTextFielsValues));
    this.props.handleComposerEditSave(this.state.editingTextFielsValues, this.resetEditTextFieldsValues.bind(this));
  }
  
  resetEditTextFieldsValues() {
    let editingTextFielsValues = Object.assign({}, this.state.editingTextFielsValues);
    let columns = Object.keys(this.props.columns);
    for(let i = 0; i < columns.length; i++) {
      editingTextFielsValues[columns[i].trim()] = null;
      let textField = columns[i].trim().toUpperCase() !== "ID" ? document.getElementById("Edit" + columns[i]) : null;
      if(textField !== null) {
        textField.value = null;
      }
    }
    this.setState({
      editingTextFielsValues: editingTextFielsValues,
      editingComposerId: -1
    });
  }
  
  render() {
  let composers = this.props.composers;
  let columns = this.props.columns;
    return (
      <Table>
        <TableHeader
          adjustForCheckbox = {false}
          displaySelectAll = {false}
          className="table-header">
          <ComposersTableHeader columns = {columns} />
        </TableHeader>  
        <TableBody>
        {composers.map((composer, index) => {
          return (
            <ComposersTableRow 
              key = {index}
              composer = {composer}
              index = {index}
              handleComposerDelete = {(id) => this.props.handleComposerDelete(id)}
              handleComposerEditSave = {() => this.handleComposerEditSave()}
              handleComposerEditCancel = {() => this.handleComposerEditCancel()}
              handleComposerEditStart = {(id) => this.handleComposerEditStart(id)}
              handleComposerTextFieldEdit = {(event, newInput) => this.handleComposerTextFieldEdit(event, newInput)}
              editingComposerId = {this.state.editingComposerId}>
            </ComposersTableRow>
          )})}
          <AddComposerTableRow
            index = {composers.length}
            columns = {columns}
            handleComposerAdd = {(data, callback) => this.props.handleComposerAdd(data, callback)}
            handleComposerEdit = {(event) => this.props.handleComposerEdit(event)}>
          </AddComposerTableRow>  
          </TableBody>  
      </Table>  
    );
  }
}

class MainMenu extends Component {
  render() {
    return (
      <Drawer 
        open = {this.props.open}
        docked = {false}
        onRequestChange = {(openRequest, reason) => this.props.onChangeRequest(openRequest, reason)}
        className = "main-menu">
          <MenuItem onClick={() => this.props.fetchComposers()}>Composers</MenuItem>
          <MenuItem>Pieces</MenuItem>
      </Drawer>
    );
  }
}

const InfoSnackbar = (props) => {
  return (
      <Snackbar 
        open = {props.open}
        message = {props.message}
        autoHideDuration = {2000}
        onRequestClose = {() => props.onRequestClose()}>
      </Snackbar>
  );
};

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewingMenu: false,
      popInfoSnackbar: false,
      infoSnackbarMessage: null,
      viewingComposersTable: false,
      composers: null,
      composerColumns: null,
    };
  }
  
  handleLeftIconButton() {
    this.setState({
      viewingMenu: !this.state.viewingMenu
    });
  }
  
  handleMenuChangeRequest(openRequest, reason) {
    this.setState({
      viewingMenu: openRequest
    });
  }
  
  handleSnackbarClose() {
    this.setState({
      popInfoSnackbar: false
    });
  }

  fetchComposers() {
    this.setState({
      viewingMenu: false
    });
    axios.get(BACKEND_SERVER + "/composers-table")
         .then((response) => {
           let columns = this.getColumnNames(Object.keys(response.data[0]));
           columns.push("Delete Composer");
           this.setState({
             composers: response.data,
             composerColumns: columns,
             viewingComposersTable: true
           });
         })
         .catch((error) => {
           this.setState({
            popInfoSnackbar: true,
            infoSnackbarMessage: error.message
           });
         });
  }
  
  checkInputData(data, post) {
    let goodData = true;
    let keys = Object.keys(data);
    let requestArguments = "";
    for(let i = 0; i < keys.length; i++) {
      let propValue = data[keys[i].trim()];
      goodData = keys[i].trim().toUpperCase() !== "ID" ? goodData && propValue !== null : goodData; 
      if(post) {
        requestArguments += keys[i].trim().toUpperCase() !== "ID" ? keys[i] + "=" + spacesToSeparator(propValue, REQUESTS_SEPARATOR) : "";
      }
      else {
        requestArguments += keys[i] + "=" + spacesToSeparator(propValue.toString(), REQUESTS_SEPARATOR);
      }
      requestArguments += i < keys.length - 1 ? "&" : "";
    }
    return {
      goodData: goodData,
      requestArguments: requestArguments
    };
  }
  
  handleComposerAdd(data, callback) {
    // first check if any property is null
    let checkResult = this.checkInputData(data, true);
    let goodData = checkResult.goodData;
    if(goodData) {
      let postArguments = checkResult.requestArguments;
      // make axios POST request
      axios.post(BACKEND_SERVER + "/composer?" + postArguments)
        .then((response) => {
          this.setState({
            popInfoSnackbar: true,
            infoSnackbarMessage: "Composer successfully inserted"
          });
          this.fetchComposers();
          callback();
        })  
        .catch((error) => {
          this.setState({
            popInfoSnackbar: true,
            infoSnackbarMessage: error.message
          });
        });  
    }
    else {
      this.setState({
        popInfoSnackbar: true,
        infoSnackbarMessage: "All fields must have values"
      });
    }
  }
  
  handleComposerEditSave(data, callback) {
    let checkResult = this.checkInputData(data, false);
    let goodData = checkResult.goodData;
    if(goodData) {
      let putArguments = checkResult.requestArguments;
      axios.put(BACKEND_SERVER + "/composer?" + putArguments)
        .then((response) => {
          this.setState({
            popInfoSnackbar: true,
            infoSnackbarMessage: "Composer successfully updated"
          });
          this.fetchComposers();
          callback();
        })
        .catch((error) => {
          this.setState({
            popInfoSnackbar: true,
            infoSnackbarMessage: error.message
          });
        });
    }
    else {
      this.setState({
        popInfoSnackbar: true,
        infoSnackbarMessage: "All fields need values for update"
      });
    }
  }
  
  
  handleComposerDelete(id) {
    axios.delete(BACKEND_SERVER + "/composers/" + id)
      .then((response) => {
        this.setState({
          popInfoSnackbar: true,
          infoSnackbarMessage: "Composer sucessfully deleted"
        });
        this.fetchComposers();
      })
      .catch((error) => {
        this.setState({
          popInfoSnackbar: true,
          infoSnackbarMessage: error.message
        });
      });
  }
  
  getColumnNames(keys) {
    return keys.map((key) => {
      let wordStartIndexes = [];
      let result = "";
      for (let i = 0; i < key.length; i++) {
        let character = key.charAt(i);
        if (character === character.toUpperCase() || i === key.length - 1) {
          wordStartIndexes.push(i < key.length - 1 ? i : key.length);
        }
      }
      for (let i = 0; i < wordStartIndexes.length - 1; i++) {
        result = result.concat(key.substring(wordStartIndexes[i], wordStartIndexes[i + 1]) + " ");
      }
      return result;
    });
  }
  
  render() {
    return (
      <div>
        <AppBar
          title = "The Classicals"
          className = "app-bar"
          onLeftIconButtonClick = {() => this.handleLeftIconButton()}/>
        <MainMenu
          open = {this.state.viewingMenu}
          onChangeRequest = {(openRequest, reason) => this.handleMenuChangeRequest(openRequest, reason)}
          fetchComposers = {() => this.fetchComposers()}/>
          {this.state.popInfoSnackbar ? 
            <InfoSnackbar
              open = {this.state.popInfoSnackbar}
              message = {this.state.infoSnackbarMessage}
              onRequestClose = {() => this.handleSnackbarClose()}>
            </InfoSnackbar>
          :
            <span></span>
          }
        {this.state.viewingComposersTable ? 
          <ComposersTable 
            composers = {this.state.composers} 
            columns = {this.state.composerColumns} 
            handleComposerAdd = {(data, callback) => this.handleComposerAdd(data, callback)}
            handleComposerDelete = {(id) => this.handleComposerDelete(id)}
            handleComposerEditSave = {(data, callback) => this.handleComposerEditSave(data, callback)}>
          </ComposersTable> 
          : <span></span>}
      </div>  
    );
  }
}

class MainRenderer extends Component {
  render() {
    return (
      <MuiThemeProvider muiTheme={AppTheme}>
        <Main />
      </MuiThemeProvider>
    );
  }
}

export default MainRenderer;
