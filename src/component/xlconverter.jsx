import React, { Component } from 'react';
import * as Excel from "exceljs";
import { saveAs } from 'file-saver';

class XLConverter extends Component {

    constructor(props) {
        super(props);
        this.errorStep = 0;
    }  

    createXcelFile = async () => {
        //fetching list of employees
        var employees = this.props.employeeList;
        //if employees do not excist do not create a excel
        if(employees === null) {return;}

        //setting workbook info
        const workbook = new Excel.Workbook();
        workbook.creator = 'Hema bv';
        workbook.lastModifiedBy = 'Hema rooster system';
        workbook.created = new Date();
        workbook.modified = new Date();
        workbook.lastPrinted = new Date();

        //sheet properties for displaying
        workbook.views = [
            {
              x: 0, y: 0, width: 1000, height: 1000,
              firstSheet: 0, activeTab: 1, visibility: 'visible'
            }
        ]

        //creating the sheet for the rooster
        const sheet = workbook.addWorksheet('Rooster');
        sheet.getColumn(3).outlineLevel = 6;

        sheet.columns = [
            { header: 'Personeel:', key: 'personeel', width: 32 }
        ];
          
        //adding names to excel sheet
        var index = 1;
        for(let i = 0; i < employees.length; i++){
            sheet.mergeCells("A" + (i+3+index)+":A"+(i+2+index))
            sheet.getCell("A" + (i+2+index)).value = employees[i].name + " | " + employees[i].startTime + "-" + employees[i].endTime;
            let employeeStart = new Date('1970-01-01T' + employees[i].startTime + 'Z');
            let employeeEnd = new Date('1970-01-01T' + employees[i].endTime + 'Z');
            sheet.mergeCells("BJ" + (i+3+index) + ":BJ" + (i+2+index))
            sheet.getCell("BJ" + (i+2+index)).value = this.calculateEmployeeTime(employeeEnd, employeeStart);
            employees[i].cell = sheet.getCell("A" + (i+2+index));
            employees[i].collumNumber = 1;
            employees[i].rowNumber = (i+2+index); 
            index++;
        }

        //add time table to sheet
        var timeJump = 7;
        for(let i = 0; i < 60; i++){
            if(i % 4 === 0){
                sheet.getCell(1,i+2).value = timeJump + ":00";
                timeJump += 1;
            }
        }

        //edit cell size to be smaller for 15 minute capability's
        for(let i = 0; i < 61; i++){
            sheet.getColumn(i+1).width = 2;
        }
        sheet.getColumn(1).width = 20;

        //merge time cells
        sheet.mergeCells(1,2,1,5)
        sheet.mergeCells(1,6,1,9)
        sheet.mergeCells(1,10,1,13)
        sheet.mergeCells(1,14,1,17)
        sheet.mergeCells(1,18,1,21)
        sheet.mergeCells(1,22,1,25)
        sheet.mergeCells(1,26,1,29)
        sheet.mergeCells(1,30,1,33)
        sheet.mergeCells(1,34,1,37)
        sheet.mergeCells(1,38,1,41)
        sheet.mergeCells(1,42,1,45)
        sheet.mergeCells(1,46,1,49)
        sheet.mergeCells(1,50,1,53)
        sheet.mergeCells(1,54,1,57)
        sheet.mergeCells(1,58,1,61)

        //add none working zone
        for(let i = 0; i < employees.length; i++){
            let nonWorkingCells = [];
            nonWorkingCells = this.returnNonWorkingCells(employees[i], sheet);
            nonWorkingCells.forEach(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern:'solid',
                    fgColor:{argb:'6B6B6B'}
                };
            });
        }

        //add takeaway to rooster
        let takeawayEmployees = this.getTakeawayEmployees(employees);
        for(let i = 0; i < takeawayEmployees.length; i++){
            for(let j = 0; j < this.getWorkHours(takeawayEmployees[i]); j++){
                sheet.getCell(takeawayEmployees[i].rowNumber, this.getStartCellEmployee(takeawayEmployees[i]) + j).fill = {
                    type: 'pattern',
                    pattern:'solid',
                    fgColor:{argb:'F77D63'}
                };
                sheet.getCell(takeawayEmployees[i].rowNumber+1, this.getStartCellEmployee(takeawayEmployees[i]) + j).fill = {
                    type: 'pattern',
                    pattern:'solid',
                    fgColor:{argb:'F77D63'}
                };
            }
        }

        //Add food to rooster
        let foodEmployees = this.getFoodEmployees(employees);
        for(let i = 0; i < foodEmployees.length; i++){
            for(let j = 0; j < this.getWorkHours(foodEmployees[i]); j++){
                sheet.getCell(foodEmployees[i].rowNumber, this.getStartCellEmployee(foodEmployees[i]) + j).fill = {
                    type: 'pattern',
                    pattern:'solid',
                    fgColor:{argb:'FF0404'}
                };
                sheet.getCell(foodEmployees[i].rowNumber+1, this.getStartCellEmployee(foodEmployees[i]) + j).fill = {
                    type: 'pattern',
                    pattern:'solid',
                    fgColor:{argb:'FF0404'}
                };
            }
        }

        //add register to rooster
        let storeEmployees = this.getRegisterEmployees(employees);
        for(let i = 0; i < this.getStoreOpenHours(); i++){
            let randomNumber = this.getRandomInt(storeEmployees.length);
            let assignedEmployee = storeEmployees[randomNumber];
            while(assignedEmployee.hasRegister == i || !this.isEmployeeWorking(assignedEmployee, i)){
                randomNumber = this.getRandomInt(storeEmployees.length);
                assignedEmployee = storeEmployees[randomNumber];
                this.errorStep++;
                if(this.errorStep > 10000){
                    alert("Er zijn geen voldoende mensen om de dag te openen. Voeg meer mensen toe of maak een rooster handmatig!");
                    return;
                }
            }
            this.errorStep = 0;
            storeEmployees[randomNumber].hasRegister = i+1;
            this.paintRegister(assignedEmployee, sheet, i, 1);
            if(storeEmployees[randomNumber-1] != undefined &&  this.isEmployeeWorking(storeEmployees[randomNumber-1], i)){
                this.paintRegister(storeEmployees[randomNumber-1], sheet, i, 2);
            }
            else{
                this.paintRegister(storeEmployees[randomNumber+1], sheet, i, 2);
            }
        }

        //add breaks to rooster

        //add side tasks to rooster

        //get the current date for file name
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        today = dd + '_' + mm + '_' + yyyy;

        //starting download for excel file
        workbook.xlsx.writeBuffer().then( data => {
            const blob = new Blob( [data], {type: "application/octet-stream"} );
            saveAs( blob, 'Rooster_' + today + ".xlsx");
        });

    }

    calculateTimeDiffrence = (timeA, timeB) => {
        const diff = timeA - timeB;
        let noneWorkingHours = Math.floor(diff/(1000*60*60));
        if((Math.floor(diff/(1000*60))%60) === 0){

        }
        else{
            noneWorkingHours += 0.5;
        }
        noneWorkingHours *= 4;
        return noneWorkingHours;
    }

    calculateEmployeeTime = (timeA, timeB) => {
        const diff = timeA - timeB;
        let noneWorkingHours = Math.floor(diff/(1000*60));
        let time = "" + Math.floor((noneWorkingHours/60)) + "." + (noneWorkingHours%60);
        return time;
    }

    //Returns a list of the non working cells of employee
    returnNonWorkingCells = (employee, ws) => {
        let nonWorkingCells = new Array();
        let employeeStart = new Date('1970-01-01T' + employee.startTime + 'Z');
        let storeStart = new Date('1970-01-01T07:00Z');
        let employeeEnd = new Date('1970-01-01T' + employee.endTime + 'Z');
        for(let i = 0; i < 60; i++){
            //if its a non working hour push cell
            if(i < this.calculateTimeDiffrence(employeeStart, storeStart) || (i+1) > this.calculateTimeDiffrence(employeeEnd, storeStart)){
                nonWorkingCells.push(ws.getCell(employee.rowNumber, (i+2)));
                nonWorkingCells.push(ws.getCell(employee.rowNumber+1, (i+2)));
            }
        }
        return nonWorkingCells;
    }

    //adds certain amount of hours to a date the hours can be given
    addHours =(numOfHours, date = new Date()) => {
        date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000);
      
        return date;
      }

    //return if employee is working in the given work hour
    isEmployeeWorking = (employee, hour) => {
        let storeOpenStart = new Date('1970-01-01T' + document.getElementById("store-time-start").value + 'Z');
        storeOpenStart = this.addHours(hour, storeOpenStart);
        let employeeStart = new Date('1970-01-01T' + employee.startTime + 'Z');
        let employeeEnd = new Date('1970-01-01T' + employee.endTime + 'Z');
        if((employeeStart.getHours()-1) < storeOpenStart.getHours() && (employeeEnd.getHours()-1) >= storeOpenStart.getHours()){
            return true;
        }
        else{
            return false;
        }
    }

    //get random number between 0 and max
    getRandomInt = (max) => {
        return Math.floor(Math.random() * max);
    }

    //paints 1 hour of register. Register number can be given
    paintRegister = (employee, ws, hour, register) => {
        for(let i = 0; i < 4; i++){
            ws.getCell(employee.rowNumber, this.getStoreStartColl() + ((hour*4) + i)).fill = {
                type: 'pattern',
                pattern:'solid',
                fgColor:{argb:'0020D9'}
            }
            ws.getCell(employee.rowNumber, this.getStoreStartColl() + ((hour*4) + i)).value = "" + register;

            if(register == 1){
                //Make it full celled
                ws.getCell(employee.rowNumber+1, this.getStoreStartColl() + ((hour*4) + i)).fill = {
                    type: 'pattern',
                    pattern:'solid',
                    fgColor:{argb:'0020D9'}
                }
                ws.getCell(employee.rowNumber+1, this.getStoreStartColl() + ((hour*4) + i)).value = "" + register;
            }
        }
    }

    //Returns the colum of which the store opens
    getStoreStartColl = () => {
        let storeTime = {};
        storeTime.startTime = document.getElementById("store-time-start").value;
        const d1 = new Date('1970-01-01T' + storeTime.startTime + 'Z');
        const d2 = new Date('1970-01-01T07:00Z');
        const diff = d1 - d2;
        let hours = Math.floor(diff/(1000*60*60));
        hours = hours*4;
        return hours + 2;
    }

    //return the hours of which the store will be open
    getStoreOpenHours = () => {
        let storeTime = {};
        storeTime.startTime = document.getElementById("store-time-start").value;
        storeTime.endTime = document.getElementById("store-time-end").value;
        const d1 = new Date('1970-01-01T' + storeTime.endTime + 'Z');
        const d2 = new Date('1970-01-01T' + storeTime.startTime + 'Z');
        const diff = d1 - d2;
        let hours = Math.floor(diff/(1000*60*60));
        return hours;
    }

    //Returns start colum number for employee
    getStartCellEmployee = (employee) => {
        const d1 = new Date('1970-01-01T' + employee.startTime + 'Z');
        const d2 = new Date('1970-01-01T07:00Z');
        const diff = d1 - d2;
        let hours = Math.floor(diff/(1000*60*60));
        hours *= 4;
        return hours + 2;
    }

    //Return hours a person is working that day * 4
    getWorkHours = (employee) => {
        const d1 = new Date('1970-01-01T' + employee.endTime + 'Z');
        const d2 = new Date('1970-01-01T' + employee.startTime + 'Z');
        const diff = d1 - d2;
        let hours = Math.floor(diff/(1000*60*60));
        let minutes = Math.floor(diff/(1000*60));
        hours *= 4;
        if(minutes%60 !== 0){
            hours += 2;
        }
        return hours;
    }


    //returns a list of takeaway employees if excist
    getTakeawayEmployees = (employees) => {
        let takeawayEmployees = [];
        for(let i = 0; i < employees.length; i++){
            if(employees[i].shiftType === "takeaway"){
                takeawayEmployees.push(employees[i])
            }
        }
        return takeawayEmployees;
    }

    //returns a list of food employees if excist
    getFoodEmployees = (employees) => {
        let foodEmployees = [];
        for(let i = 0; i < employees.length; i++){
            if(employees[i].shiftType === "food"){
                foodEmployees.push(employees[i]);
            }
        }
        return foodEmployees;
    }

    //return a list of store employees if excist
    getStoreEmployees = (employees) => {
        let winkelEmployees = [];
        for(let i = 0; i < employees.length; i++){
            if(employees[i].shiftType === "winkel"){
                winkelEmployees.push(employees[i]);
            }
        }
        return winkelEmployees;
    }

    //return store employees but only those that do register
    getRegisterEmployees = (employees) => {
        let winkelEmployees = [];
        for(let i = 0; i < employees.length; i++){
            if(employees[i].shiftType === "winkel" && !employees[i].ignoreRegister){
                winkelEmployees.push(employees[i]);
            }
        }
        return winkelEmployees;
    }

    state = {  }

    render() { 
        return ( 
            <div className='download-box'>
                <p>Openingstijden Winkel:</p>
                <input type="time" id="store-time-start" defaultValue="09:00" name="appt" min="07:00" max="21:00"/> -- <input type="time" id="store-time-end" defaultValue="18:00" name="appt"min="07:00" max="21:00"/>
                <button className='btn-submit' style={{marginLeft: "20px", marginRight: "20px", marginTop: "20px"}} onClick={() => this.createXcelFile()}>Download Rooster</button>
            </div>
        );
    }
}
 
export default XLConverter;