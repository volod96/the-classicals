import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// Material UI Theme provider import (necesarry)
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import * as Colors from 'material-ui/styles/colors';

// MaterialUI imports
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

// Constants for reuse
const BACKEND_SERVER = "https://seminar-tehnologii-web-volod96.c9users.io:8081/";
const VIEW_COMPOSERS_MENU_CODE = 1;

// TODO: use when learn how to style elements...
const PageTop = () => {
  return (
    <img src={BACKEND_SERVER + "background-image-top.jpg"}/>   
  );
};

const ComposersTableHeader = () => {
  return (
      <TableHeader>
        <TableRow>
          <TableHeaderColumn>ID</TableHeaderColumn>
          <TableHeaderColumn>Name</TableHeaderColumn>
          <TableHeaderColumn>Birth Date</TableHeaderColumn>
          <TableHeaderColumn>Popularity</TableHeaderColumn>
          <TableHeaderColumn>Period</TableHeaderColumn>
        </TableRow>
      </TableHeader> 
  );
};

const ComposersTableRow = (props) => {
  return (
    <TableRow>
      <TableRowColumn>props.id</TableRowColumn>
      <TableRowColumn>props.name</TableRowColumn>
      <TableRowColumn>props.birthDate</TableRowColumn>
      <TableRowColumn>props.popularity</TableRowColumn>
      <TableRowColumn>props.period</TableRowColumn>
    </TableRow>  
  );
};

const ComposersTable = (props) => {
  let composers = props.composers;
  return (
    <Table>
    <ComposersTableHeader />
    composers.map((composer) => {
      return (
        <ComposersTableRow 
          id = {composer.id}
          name = {composer.name}
          birthDate = {composer.birthDate}
          popularity = {composer.popularity}
          period = {composer.period}>
        </ComposersTableRow>
      )})
    </Table>  
  );
}

class MainMenu extends Component {
  render() {
    return (
      <Drawer 
      open = {this.props.open}
      docked = {false}
      onRequestChange = {(openRequest, reason) => this.props.onChangeRequest(openRequest, reason)}
      className = "main-menu">
        <MenuItem onClick-{() => this.props.handleComposersView()}>View composers</MenuItem>
        <MenuItem>Edit composers</MenuItem>
        <MenuItem>View pieces</MenuItem>
        <MenuItem>Edit pieces</MenuItem>
      </Drawer>
    );
  }
}


class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewingMenu: false
      viewingComposersTble: false
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
  
  handleMenuItem(itemCode) {
    if(itemCode === VIEW_COMPOSERS_MENU_CODE) {
      handleComposersView();
    }
  }
  
  handleComposersView() {
    let composers;
    axios.get(BACKEND_SERVER + "/composers")
         .then((response) => {
           composers = JSON.parse(response);
    });
  }
  
  render() {
    return (
      <MuiThemeProvider>
        <AppBar
          title = "The Classicals"
          className = "app-bar"
          onLeftIconButtonClick = {() => this.handleLeftIconButton()}
        />
        <MainMenu
          open = {this.state.viewingMenu}
          onChangeRequest = {(openRequest, reason) => this.handleMenuChangeRequest(openRequest, reason)}
          handleComposersView = {() => this.handleMenuItem(VIEW_COMPOSERS_MENU_CODE)}
        />
      </MuiThemeProvider> 
    );
  }
}

export default Main;
