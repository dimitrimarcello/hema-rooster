import React, { Component } from 'react';
import XLConverter from '../component/xlconverter';
import './homepage.css';

class HomePage extends Component {

    state = { 
        employees: []
    } 

    constructor(props){
        super(props);
        this.draggedPerson = null;
    }

    componentDidMount(){
        let inputField = document.getElementById('employee-name');

        inputField.addEventListener('keyup', (e) => {
            if(e.key == "Enter"){
                this.addEmployee();
            }
        });

        let savedEmployees = JSON.parse(localStorage.getItem("employees"));

        if(savedEmployees == null){ return }

        this.setState({
            employees: savedEmployees
        });
    }

    returnEmployees = () => {
        if(this.state.employees.length > 0){ return this.state.employees; }
        let savedEmployees = [];
        savedEmployees = JSON.parse(localStorage.getItem("employees"));
        return savedEmployees;
    }

    addEmployee = () => {
        let newEmployees = this.state.employees;
        let employee = {};
        employee.name = document.getElementById('employee-name').value;
        employee.shiftType = document.getElementById('tasks').value;
        employee.startTime = document.getElementById('employee-time-start').value;
        employee.endTime = document.getElementById('employee-time-end').value;
        employee.ignoreRegister = document.getElementById('ignoreRegister').checked;
        if(employee.name == ""){ return; }
        if(employee.startTime == ""){ return; }
        if(employee.endTime == ""){ return; }
        newEmployees.push(employee);
        document.getElementById('employee-name').value = "";
        document.getElementById('ignoreRegister').checked = false;
        this.setState({
            employees: newEmployees
        })
        localStorage.setItem("employees", JSON.stringify(this.state.employees))
    }

    getDepartmentColor = (employee) => {
        if(employee.shiftType == "takeaway"){
            return "rgb(194, 99, 51)";
        }
        if(employee.shiftType == "food"){
            return "rgb(240, 37, 37)";
        }
        if(employee.shiftType == "winkel"){
            return "rgb(238, 238, 238)";
        }

    }

    deleteEmployee = (employeeToDelete) => {
        let newList = [];
        for(let i = 0; i < this.state.employees.length; i++){
            if(this.state.employees[i].name == employeeToDelete.name){

            }
            else{
                newList.push(this.state.employees[i])
            }
        }
        localStorage.setItem("employees", JSON.stringify(newList))
        this.setState({
            employees: newList
        });
    }

    enableDragEffect = (e) => {
        e.preventDefault();
        this.draggedPerson = this.getEmployeeIndexByName(e.target.firstChild.innerHTML);
        e.target.style.opacity = 0.2;
    }

    disableDragEffect = (e) => {
        e.preventDefault();
        e.target.style.opacity = 1;
    }

    enableHint = (e) => {
        e.preventDefault();
        e.target.classList.add("hover-hint");
    }

    disableHint = (e) => {
        e.preventDefault();
        e.target.classList.remove("hover-hint");
    }

    switchEmployees = (e) => {
        let personToSwitch = this.getEmployeeIndexByName(e.target.firstChild.innerHTML)
        Array.prototype.swap = function (x,y) {
            var b = this[x];
            this[x] = this[y];
            this[y] = b;
            return this;
        }
        let newOrder = this.state.employees;
        newOrder.swap(this.draggedPerson, personToSwitch);
        this.removeAllHint();
        this.setState({
            employees: newOrder
        })
    }

    removeAllHint = () => {
        let hints = document.getElementsByClassName('hover-hint');
        for(let i = 0; i < hints.length; i++){
            hints[i].classList.remove('hover-hint')
        }
    }

    getEmployeeIndexByName = (name) => {
        for(let i = 0; 0 < this.state.employees.length; i++){
            if(this.state.employees[i].name === name){
                return i;
            }
        }
    }

    renderEmployees = () => {
        const employeesRender = this.state.employees.map((employee) =>{
            return (
                <div onDrop={this.switchEmployees} onDragLeave={this.disableHint} onDragOver={this.enableHint} onDragEnd={this.disableDragEffect} onDrag={this.enableDragEffect} draggable="true" style={{backgroundColor: this.getDepartmentColor(employee)}} className='employee-tab'>
                    <p style={{pointerEvents: "none"}}>{employee.name}</p>
                    <p style={{marginLeft: "auto", marginRight: "1px", pointerEvents: "none"}}>{employee.shiftType}</p> 
                    <p style={{marginLeft: "auto", marginRight: "1px", pointerEvents: "none"}}>{employee.startTime}-{employee.endTime}</p> 
                    <button onClick={() => this.deleteEmployee(employee)} className='btn-empty user-delete-button'>X</button>
                </div>
                );
        });
        return (
            <React.Fragment>
                {employeesRender}
            </React.Fragment>
        );
    }

    clearList = () => {
        let clearedEmployees = [];
        this.setState({
            employees: clearedEmployees
        })
        localStorage.setItem("employees", JSON.stringify(null))
    }

    renderClearButton = () => {
        if(this.state.employees !== null && this.state.employees.length > 0){
            return (
                <React.Fragment>
                    <button style={{marginBottom: "30px"}} className='btn-delete' onClick={() => this.clearList()}>Verwijder Lijst</button>
                </React.Fragment>
            );
        }
    }

    updateTime = (e) => {
        console.log(e);
    }

    render() { 
        return (
            <React.Fragment>
                <div className='top-banner'>
                    <img className='corner-logo' src="img/hema.png" />
                    <h1 className='left-text'>Rooster Systeem</h1>
                    <XLConverter id='xlConverter' employeeList={this.returnEmployees()}></XLConverter>
                </div>
                <div id='home-body'>
                    <div id='user-form'>
                        <p>Voeg persoon toe:</p>
                        <input id='employee-name' placeholder='Naam' type="text" />
                        <select name="tasks" id="tasks">
                            <option value="winkel">Winkel</option>
                            <option value="takeaway">Takeaway</option>
                            <option value="food">Food</option>
                        </select>
                        <p>Werk uren medewerker</p>
                        <input type="time" id="employee-time-start" name="appt" defaultValue="09:00" min="09:00" max="18:00"/> -- <input type="time" id="employee-time-end" name="appt" defaultValue="18:00" min="09:00" max="18:00"/>
                        <div style={{marginBottom: "30px", marginTop: "30px"}}>
                            <p style={{display: "inline"}}>Geen Kassa:</p><input id='ignoreRegister' type="checkbox"></input>
                        </div>
                        <button onClick={this.addEmployee} style={{marginBottom: "20px"}} className='btn-submit'>Voeg persoon toe</button>
                    </div>
                    <div className='w-100' style={{marginLeft: "30px", marginRight: "10px"}}>
                        {this.renderClearButton()}
                    </div>
                    <div id='users'>
                        {this.renderEmployees()}
                    </div>
                </div>
            </React.Fragment>
        );
    }
}
 
export default HomePage;